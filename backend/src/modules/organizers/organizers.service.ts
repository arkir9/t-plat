import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrganizerProfile } from './entities/organizer-profile.entity';
import {
  OrganizerApplication,
  ApplicationStatus,
} from './entities/organizer-application.entity';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

export interface OrganizerAnalytics {
  totalTicketsSold: number;
  currentBalance: number;
  projectedIncome: number;
  pastIncome: number;
  currency: string;
  activeEvents: Array<{
    id: string;
    title: string;
    startDate: string;
    status: string;
    ticketsSold: number;
    revenue: number;
    bannerImageUrl: string | null;
  }>;
}

@Injectable()
export class OrganizersService {
  private readonly logger = new Logger(OrganizersService.name);

  constructor(
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    @InjectRepository(OrganizerApplication)
    private applicationRepository: Repository<OrganizerApplication>,
    private dataSource: DataSource,
  ) {}

  // ─── Organizer Profile CRUD ────────────────────────────────────────────

  async create(userId: string, createDto: any): Promise<OrganizerProfile> {
    const profile = this.organizerProfileRepository.create({
      userId,
      ...createDto,
    });
    const saved = await this.organizerProfileRepository.save(profile);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findByUserId(userId: string): Promise<OrganizerProfile[]> {
    return this.organizerProfileRepository.find({
      where: { userId },
    });
  }

  async findOne(id: string): Promise<OrganizerProfile> {
    return this.organizerProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async verifyMyPendingProfiles(userId: string): Promise<{ updated: number }> {
    const result = await this.organizerProfileRepository.update(
      { userId, verificationStatus: 'pending' },
      { verificationStatus: 'verified' },
    );
    return { updated: result.affected ?? 0 };
  }

  // ─── Organizer Application Flow ────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  async apply(userId: string, dto: ApplyOrganizerDto): Promise<{ message: string }> {
    const existing = await this.applicationRepository.findOne({
      where: { userId },
    });

    if (existing) {
      if (existing.status === ApplicationStatus.APPROVED) {
        throw new ConflictException('You already have an approved organizer application');
      }
      if (
        existing.status === ApplicationStatus.PENDING_EMAIL ||
        existing.status === ApplicationStatus.PENDING_ADMIN
      ) {
        throw new ConflictException(
          'You already have a pending application. Check your email for the verification code.',
        );
      }
      // If previously rejected, allow re-application by updating the existing record
      existing.businessName = dto.businessName;
      existing.email = dto.email;
      existing.phone = dto.phone;
      existing.status = ApplicationStatus.PENDING_EMAIL;
      const otp = this.generateOtp();
      existing.emailOtp = otp;
      await this.applicationRepository.save(existing);

      this.logger.log(
        `[OTP] Re-application OTP for user ${userId} (${dto.email}): ${otp}`,
      );

      return { message: 'Application submitted. A verification code has been sent to your email.' };
    }

    const otp = this.generateOtp();

    const application = this.applicationRepository.create({
      userId,
      businessName: dto.businessName,
      email: dto.email,
      phone: dto.phone,
      status: ApplicationStatus.PENDING_EMAIL,
      emailOtp: otp,
    });

    await this.applicationRepository.save(application);

    // In production, send OTP via email. For now, log it.
    this.logger.log(
      `[OTP] Organizer application OTP for user ${userId} (${dto.email}): ${otp}`,
    );

    return { message: 'Application submitted. A verification code has been sent to your email.' };
  }

  async verifyEmail(userId: string, dto: VerifyEmailDto): Promise<{ message: string }> {
    const application = await this.applicationRepository.findOne({
      where: { userId },
    });

    if (!application) {
      throw new NotFoundException('No application found. Please apply first.');
    }

    if (application.status !== ApplicationStatus.PENDING_EMAIL) {
      throw new BadRequestException(
        `Application is already in '${application.status}' state and cannot be verified.`,
      );
    }

    if (!application.emailOtp || application.emailOtp !== dto.emailOtp) {
      throw new BadRequestException('Invalid verification code. Please try again.');
    }

    application.status = ApplicationStatus.PENDING_ADMIN;
    application.emailOtp = null;
    await this.applicationRepository.save(application);

    return { message: 'Email verified! Your application is now pending admin review.' };
  }

  async getMyApplication(userId: string): Promise<OrganizerApplication | null> {
    return this.applicationRepository.findOne({
      where: { userId },
    });
  }

  // Used by AdminService
  async findApplicationById(id: string): Promise<OrganizerApplication | null> {
    return this.applicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findPendingAdminApplications(): Promise<OrganizerApplication[]> {
    return this.applicationRepository.find({
      where: { status: ApplicationStatus.PENDING_ADMIN },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
  ): Promise<OrganizerApplication> {
    const application = await this.applicationRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    application.status = status;
    return this.applicationRepository.save(application);
  }

  // ─── Financial Analytics ────────────────────────────────────────────────

  async getAnalytics(userId: string): Promise<OrganizerAnalytics> {
    const profiles = await this.organizerProfileRepository.find({
      where: { userId },
      select: ['id'],
    });

    if (!profiles.length) {
      return {
        totalTicketsSold: 0,
        currentBalance: 0,
        projectedIncome: 0,
        pastIncome: 0,
        currency: 'KES',
        activeEvents: [],
      };
    }

    const profileIds = profiles.map((p) => p.id);

    const [financials] = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(oi.quantity), 0)::int                       AS "totalTicketsSold",
        COALESCE(SUM(o.net_amount) FILTER (
          WHERE o.payment_status = 'completed'
        ), 0)::numeric                                           AS "currentBalance",
        COALESCE(SUM(o.net_amount) FILTER (
          WHERE o.payment_status = 'completed'
            AND e.start_date > NOW()
            AND e.status = 'published'
        ), 0)::numeric                                           AS "projectedIncome",
        COALESCE(SUM(o.net_amount) FILTER (
          WHERE o.payment_status = 'completed'
            AND e.start_date <= NOW()
        ), 0)::numeric                                           AS "pastIncome"
      FROM orders o
      JOIN events e       ON o.event_id = e.id
      JOIN order_items oi ON oi.order_id = o.id
      WHERE e.organizer_id = ANY($1)
        AND o.payment_status = 'completed'
      `,
      [profileIds],
    );

    const activeEvents = await this.dataSource.query(
      `
      SELECT
        e.id,
        e.title,
        e.start_date                              AS "startDate",
        e.status,
        e.banner_image_url                        AS "bannerImageUrl",
        COALESCE(SUM(oi.quantity), 0)::int        AS "ticketsSold",
        COALESCE(SUM(o.net_amount), 0)::numeric   AS "revenue"
      FROM events e
      LEFT JOIN orders o       ON o.event_id = e.id AND o.payment_status = 'completed'
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE e.organizer_id = ANY($1)
        AND e.status IN ('published', 'completed')
      GROUP BY e.id
      ORDER BY e.start_date DESC
      LIMIT 20
      `,
      [profileIds],
    );

    return {
      totalTicketsSold: Number(financials?.totalTicketsSold ?? 0),
      currentBalance: Number(financials?.currentBalance ?? 0),
      projectedIncome: Number(financials?.projectedIncome ?? 0),
      pastIncome: Number(financials?.pastIncome ?? 0),
      currency: 'KES',
      activeEvents: activeEvents.map((e: any) => ({
        ...e,
        ticketsSold: Number(e.ticketsSold),
        revenue: Number(e.revenue),
      })),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OrganizerProfile } from '../organizers/entities/organizer-profile.entity';
import {
  OrganizerApplication,
  ApplicationStatus,
} from '../organizers/entities/organizer-application.entity';
import { OrganizersService } from '../organizers/organizers.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
    private organizersService: OrganizersService,
  ) {}

  async getPendingApplications(): Promise<OrganizerApplication[]> {
    return this.organizersService.findPendingAdminApplications();
  }

  async approveApplication(applicationId: string): Promise<{ message: string }> {
    const application =
      await this.organizersService.findApplicationById(applicationId);

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.PENDING_ADMIN) {
      throw new BadRequestException(
        `Cannot approve application in '${application.status}' status. Only 'pending_admin' applications can be approved.`,
      );
    }

    // 1. Update application status
    await this.organizersService.updateApplicationStatus(
      applicationId,
      ApplicationStatus.APPROVED,
    );

    // 2. Create OrganizerProfile for the user
    const existingProfile = await this.organizerProfileRepository.findOne({
      where: { userId: application.userId, profileType: 'event_organizer' },
    });

    if (!existingProfile) {
      const profile = this.organizerProfileRepository.create({
        userId: application.userId,
        profileType: 'event_organizer',
        name: application.businessName,
        verificationStatus: 'verified',
      });
      await this.organizerProfileRepository.save(profile);
      this.logger.log(
        `Created organizer profile for user ${application.userId} (${application.businessName})`,
      );
    }

    // 3. Update user role to 'organizer'
    await this.userRepository.update(application.userId, { role: 'organizer' });

    this.logger.log(
      `Approved organizer application ${applicationId} for user ${application.userId}`,
    );

    return { message: `Application approved. ${application.businessName} is now an organizer.` };
  }

  async rejectApplication(applicationId: string): Promise<{ message: string }> {
    const application =
      await this.organizersService.findApplicationById(applicationId);

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.PENDING_ADMIN) {
      throw new BadRequestException(
        `Cannot reject application in '${application.status}' status.`,
      );
    }

    await this.organizersService.updateApplicationStatus(
      applicationId,
      ApplicationStatus.REJECTED,
    );

    this.logger.log(
      `Rejected organizer application ${applicationId} for user ${application.userId}`,
    );

    return { message: 'Application rejected.' };
  }
}

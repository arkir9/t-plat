import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { EventCheckIn, CheckInType } from './entities/event-check-in.entity';
import { SafetyReport, ReportStatus } from './entities/safety-report.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateEmergencyContactDto, CheckInDto, CreateSafetyReportDto } from './dto';

@Injectable()
export class SafetyService {
  constructor(
    @InjectRepository(EmergencyContact)
    private emergencyContactRepository: Repository<EmergencyContact>,
    @InjectRepository(EventCheckIn)
    private eventCheckInRepository: Repository<EventCheckIn>,
    @InjectRepository(SafetyReport)
    private safetyReportRepository: Repository<SafetyReport>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Get user's emergency contacts
   */
  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return this.emergencyContactRepository.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    userId: string,
    createDto: CreateEmergencyContactDto,
  ): Promise<EmergencyContact> {
    // If this is set as primary, unset other primary contacts
    if (createDto.isPrimary) {
      await this.emergencyContactRepository.update(
        { userId, isPrimary: true },
        { isPrimary: false },
      );
    }

    const contact = this.emergencyContactRepository.create({
      userId,
      ...createDto,
      isPrimary: createDto.isPrimary ?? false,
    });

    return this.emergencyContactRepository.save(contact);
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    contactId: string,
    userId: string,
    updateDto: Partial<CreateEmergencyContactDto>,
  ): Promise<EmergencyContact> {
    const contact = await this.emergencyContactRepository.findOne({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    // If setting as primary, unset other primary contacts
    if (updateDto.isPrimary) {
      await this.emergencyContactRepository.update(
        { userId, isPrimary: true, id: Not(contactId) },
        { isPrimary: false },
      );
    }

    Object.assign(contact, updateDto);
    return this.emergencyContactRepository.save(contact);
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(contactId: string, userId: string): Promise<void> {
    const result = await this.emergencyContactRepository.delete({
      id: contactId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Emergency contact not found');
    }
  }

  /**
   * Check in to event
   */
  async checkIn(userId: string, checkInDto: CheckInDto): Promise<EventCheckIn> {
    const event = await this.eventRepository.findOne({
      where: { id: checkInDto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Verify ticket if provided
    if (checkInDto.ticketId) {
      const ticket = await this.ticketRepository.findOne({
        where: {
          id: checkInDto.ticketId,
          userId,
          eventId: checkInDto.eventId,
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found or does not belong to you');
      }
    }

    // Check if already checked in
    const existingCheckIn = await this.eventCheckInRepository.findOne({
      where: {
        userId,
        eventId: checkInDto.eventId,
        checkInType: CheckInType.ARRIVAL,
      },
      order: { createdAt: 'DESC' },
    });

    if (existingCheckIn) {
      // Check if there's a departure after this arrival
      const departure = await this.eventCheckInRepository.findOne({
        where: {
          userId,
          eventId: checkInDto.eventId,
          checkInType: CheckInType.DEPARTURE,
        },
        order: { createdAt: 'DESC' },
      });

      if (!departure || departure.createdAt < existingCheckIn.createdAt) {
        throw new BadRequestException('You are already checked in to this event');
      }
    }

    const checkIn = this.eventCheckInRepository.create({
      userId,
      eventId: checkInDto.eventId,
      ticketId: checkInDto.ticketId,
      checkInType: CheckInType.ARRIVAL,
      locationLatitude: checkInDto.latitude,
      locationLongitude: checkInDto.longitude,
      sharedWithContacts: checkInDto.shareWithContacts ?? false,
    });

    return this.eventCheckInRepository.save(checkIn);
  }

  /**
   * Check out from event
   */
  async checkOut(userId: string, eventId: string): Promise<EventCheckIn> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if checked in
    const arrival = await this.eventCheckInRepository.findOne({
      where: {
        userId,
        eventId,
        checkInType: CheckInType.ARRIVAL,
      },
      order: { createdAt: 'DESC' },
    });

    if (!arrival) {
      throw new BadRequestException('You are not checked in to this event');
    }

    // Check if already checked out
    const departure = await this.eventCheckInRepository.findOne({
      where: {
        userId,
        eventId,
        checkInType: CheckInType.DEPARTURE,
      },
      order: { createdAt: 'DESC' },
    });

    if (departure && departure.createdAt > arrival.createdAt) {
      throw new BadRequestException('You are already checked out from this event');
    }

    const checkOut = this.eventCheckInRepository.create({
      userId,
      eventId,
      ticketId: arrival.ticketId,
      checkInType: CheckInType.DEPARTURE,
      locationLatitude: arrival.locationLatitude,
      locationLongitude: arrival.locationLongitude,
      sharedWithContacts: arrival.sharedWithContacts,
    });

    return this.eventCheckInRepository.save(checkOut);
  }

  /**
   * Get user's check-in status for an event
   */
  async getCheckInStatus(userId: string, eventId: string) {
    const arrival = await this.eventCheckInRepository.findOne({
      where: {
        userId,
        eventId,
        checkInType: CheckInType.ARRIVAL,
      },
      order: { createdAt: 'DESC' },
    });

    if (!arrival) {
      return { checkedIn: false };
    }

    const departure = await this.eventCheckInRepository.findOne({
      where: {
        userId,
        eventId,
        checkInType: CheckInType.DEPARTURE,
      },
      order: { createdAt: 'DESC' },
    });

    const isCheckedIn = !departure || departure.createdAt < arrival.createdAt;

    return {
      checkedIn: isCheckedIn,
      arrivalTime: arrival.createdAt,
      departureTime: departure?.createdAt || null,
    };
  }

  /**
   * Create safety report
   */
  async createSafetyReport(
    userId: string,
    createDto: CreateSafetyReportDto,
  ): Promise<SafetyReport> {
    const event = await this.eventRepository.findOne({
      where: { id: createDto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const report = this.safetyReportRepository.create({
      userId,
      eventId: createDto.eventId,
      reportType: createDto.reportType,
      description: createDto.description,
      status: ReportStatus.PENDING,
    });

    return this.safetyReportRepository.save(report);
  }

  /**
   * Get user's safety reports
   */
  async getUserSafetyReports(userId: string): Promise<SafetyReport[]> {
    return this.safetyReportRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' },
    });
  }
}

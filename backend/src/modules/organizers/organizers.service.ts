import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizerProfile } from './entities/organizer-profile.entity';

@Injectable()
export class OrganizersService {
  constructor(
    @InjectRepository(OrganizerProfile)
    private organizerProfileRepository: Repository<OrganizerProfile>,
  ) {}

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

  /** Set all pending organizer profiles for a user to verified (for dev / admin use). */
  async verifyMyPendingProfiles(userId: string): Promise<{ updated: number }> {
    const result = await this.organizerProfileRepository.update(
      { userId, verificationStatus: 'pending' },
      { verificationStatus: 'verified' },
    );
    return { updated: result.affected ?? 0 };
  }
}

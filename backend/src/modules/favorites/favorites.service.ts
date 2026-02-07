import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Event } from '../events/entities/event.entity';
import { EventsService } from '../events/events.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    private readonly eventsService: EventsService,
  ) {}

  async add(userId: string, eventId: string): Promise<{ added: boolean }> {
    const event = await this.eventsService.findEventById(eventId).catch(() => null);
    if (!event) throw new NotFoundException('Event not found');
    const existing = await this.favoriteRepository.findOne({ where: { userId, eventId } });
    if (existing) return { added: false };
    await this.favoriteRepository.save({ userId, eventId });
    return { added: true };
  }

  async remove(userId: string, eventId: string): Promise<{ removed: boolean }> {
    const result = await this.favoriteRepository.delete({ userId, eventId });
    return { removed: (result.affected ?? 0) > 0 };
  }

  async list(userId: string): Promise<any[]> {
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' },
    });
    const dtos: any[] = [];
    for (const f of favorites) {
      if (f.eventId) {
        try {
          const dto = await this.eventsService.findEventById(f.eventId);
          dtos.push(dto);
        } catch (_) {}
      }
    }
    return dtos;
  }

  async isFavorite(userId: string, eventId: string): Promise<boolean> {
    const found = await this.favoriteRepository.findOne({ where: { userId, eventId } });
    return !!found;
  }
}

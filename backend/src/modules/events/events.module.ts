import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventIngestionService } from './services/event-ingestion.service';
import { Event } from './entities/event.entity';
import { EventInteraction } from './entities/event-interaction.entity';
import { OrganizersModule } from '../organizers/organizers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventInteraction]), HttpModule, OrganizersModule],
  controllers: [EventsController],
  providers: [EventsService, EventIngestionService],
  exports: [EventsService],
})
export class EventsModule {}

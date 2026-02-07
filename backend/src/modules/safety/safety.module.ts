import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { EventCheckIn } from './entities/event-check-in.entity';
import { SafetyReport } from './entities/safety-report.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmergencyContact,
      EventCheckIn,
      SafetyReport,
      Event,
      Ticket,
    ]),
  ],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}

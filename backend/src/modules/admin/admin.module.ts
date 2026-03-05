import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { User } from '../users/entities/user.entity';
import { OrganizerProfile } from '../organizers/entities/organizer-profile.entity';
import { OrganizersModule } from '../organizers/organizers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OrganizerProfile]),
    OrganizersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}

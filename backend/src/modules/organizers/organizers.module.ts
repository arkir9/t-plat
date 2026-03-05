import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizerProfile } from './entities/organizer-profile.entity';
import { OrganizerApplication } from './entities/organizer-application.entity';
import { OrganizersService } from './organizers.service';
import { OrganizersController } from './organizers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizerProfile, OrganizerApplication])],
  controllers: [OrganizersController],
  providers: [OrganizersService],
  exports: [OrganizersService],
})
export class OrganizersModule {}

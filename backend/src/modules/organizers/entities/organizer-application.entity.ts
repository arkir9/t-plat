import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ApplicationStatus {
  PENDING_EMAIL = 'pending_email',
  PENDING_ADMIN = 'pending_admin',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('organizer_applications')
@Index(['userId'])
@Index(['status'])
@Index(['email'])
export class OrganizerApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, name: 'business_name' })
  businessName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING_EMAIL,
  })
  status: ApplicationStatus;

  @Column({ type: 'varchar', length: 6, nullable: true, name: 'email_otp' })
  emailOtp: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

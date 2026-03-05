import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { OrganizerProfile } from '../../organizers/entities/organizer-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'text', nullable: true, name: 'profile_image_url' })
  profileImageUrl: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: 'user' | 'organizer' | 'admin';

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'google_id' })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'apple_sub' })
  appleSub: string | null;

  @OneToMany(() => OrganizerProfile, (profile) => profile.user)
  organizerProfiles: OrganizerProfile[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

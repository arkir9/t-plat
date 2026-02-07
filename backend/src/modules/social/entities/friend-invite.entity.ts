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

export type FriendInviteStatus = 'pending' | 'accepted' | 'expired';

@Entity('friend_invites')
@Index(['inviterUserId'])
@Index(['inviteeEmail'])
@Index(['status'])
export class FriendInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inviter_user_id' })
  inviterUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_user_id' })
  inviter: User;

  @Column({ name: 'invitee_email', type: 'varchar', length: 255 })
  inviteeEmail: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'varchar', length: 20 })
  status: FriendInviteStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


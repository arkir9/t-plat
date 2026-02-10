import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFriend, FriendStatus } from './entities/user-friend.entity';
import { FriendInvite, FriendInviteStatus } from './entities/friend-invite.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(UserFriend)
    private friendRepository: Repository<UserFriend>,
    @InjectRepository(FriendInvite)
    private inviteRepository: Repository<FriendInvite>,
  ) {}

  // Groundwork: just method signatures and return types; real logic will be added later.

  async inviteByEmail(userId: string, email: string): Promise<FriendInvite> {
    // TODO: generate token, send email, etc.
    const invite = this.inviteRepository.create({
      inviterUserId: userId,
      inviteeEmail: email,
      token: '',
      status: 'pending' as FriendInviteStatus,
    });
    return this.inviteRepository.save(invite);
  }

  async sendFriendRequest(userId: string, friendUserId: string): Promise<UserFriend> {
    // TODO: create pending friend connection
    const connection = this.friendRepository.create({
      userId,
      friendUserId,
      status: 'pending' as FriendStatus,
    });
    return this.friendRepository.save(connection);
  }

  async acceptFriendRequest(connectionId: string): Promise<UserFriend | null> {
    // TODO: implement accept logic + reciprocal connection if desired
    return this.friendRepository.findOne({ where: { id: connectionId } });
  }

  async listFriends(userId: string): Promise<UserFriend[]> {
    // TODO: filter to accepted friends only
    return this.friendRepository.find({
      where: { userId },
    });
  }
}

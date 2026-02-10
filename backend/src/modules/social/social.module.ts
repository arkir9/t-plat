import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFriend } from './entities/user-friend.entity';
import { FriendInvite } from './entities/friend-invite.entity';
import { SocialService } from './social.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserFriend, FriendInvite])],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}

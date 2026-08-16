import { IsString, IsUUID, MinLength, MaxLength, Matches, IsBoolean } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username!: string;
}

export class RespondFriendRequestDto {
  @IsUUID()
  friendId!: string;

  @IsBoolean()
  accept!: boolean;
}

export class BlockByUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username!: string;
}

export class AddFriendByIdDto {
  @IsUUID()
  targetUserId!: string;
}

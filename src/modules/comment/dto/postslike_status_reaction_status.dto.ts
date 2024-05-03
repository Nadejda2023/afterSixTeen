import { IsEnum, IsString } from 'class-validator';
import { LikeStatus } from '../../../models/postSchema';
export class LikeStatusDto {
  @IsEnum(LikeStatus)
  @IsString()
  likeStatus: LikeStatus;
}

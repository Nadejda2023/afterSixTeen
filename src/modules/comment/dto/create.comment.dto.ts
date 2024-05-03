import { IsString, Length } from 'class-validator';
import { Trim } from '../../../infastructure/decorators/transform/trim';

export class CreateAndUpdateCommentDto {
  @IsString()
  @Trim()
  @Length(20, 300)
  content: string;
}

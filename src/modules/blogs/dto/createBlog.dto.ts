import { IsString, IsUrl, Length, MaxLength } from 'class-validator';
import { Trim } from '../../../infastructure/decorators/transform/trim';

export class CreateBlogDto {
  @Length(1, 15, { message: 'Length not correct' })
  @Trim()
  @IsString()
  name: string;
  @MaxLength(100)
  @Trim()
  @IsString()
  description: string;
  @IsString()
  @IsUrl()
  @Trim()
  @MaxLength(100)
  websiteUrl: string;
}

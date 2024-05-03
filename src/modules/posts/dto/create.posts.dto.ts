import { IsString } from 'class-validator';
import { Length } from 'class-validator';
import { Trim } from '../../../infastructure/decorators/transform/trim';
import { BlogIdExist } from '../../../infastructure/decorators/param/blog.decorator';

export class CreateAndUpdatePostDto {
  @Length(1, 30)
  @Trim()
  @IsString()
  title: string;
  @Length(1, 100)
  @Trim()
  @IsString()
  shortDescription: string;
  @Length(1, 1000)
  @Trim()
  @IsString()
  content: string;
  @BlogIdExist()
  @Trim()
  @IsString()
  blogId: string;
}

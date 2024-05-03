import { IsEmail, IsString, Length } from 'class-validator';
//import { Trim } from 'src/infastructure/decorators/transform/trim';

export class UsersInputDto {
  //@Trim()
  @Length(3, 10, { message: 'Length not correct' })
  @IsString()
  login: string;
  @IsEmail()
  email: string;
  @Length(6, 20)
  @IsString()
  password: string;
}

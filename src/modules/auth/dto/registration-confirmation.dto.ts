import { IsString, IsUUID } from 'class-validator';

export class RegistrationConfirmationDto {
  @IsUUID()
  @IsString({ message: 'Must be string' })
  code: string;
}

import { IsEmail } from 'class-validator';

export class RegistrationEmailResendingDto {
  @IsEmail({}, { message: 'Must be email' })
  email: string;
}

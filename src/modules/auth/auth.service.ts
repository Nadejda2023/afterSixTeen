import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthRepository } from './auth.repository';

import { NewPasswordDto } from './dto/new-password.dto';
import { Auth, AuthDocument } from '../../models/authSchemas';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { UserRepository } from '../users/users.repository';
import { UserService } from '../users/users.service';
import { EmailService } from '../../adapters/email-adapter';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: Model<AuthDocument>,
    protected usersQueryRepository: UsersQueryRepository,
    protected userRepository: UserRepository,
    protected authRepository: AuthRepository,
    protected emailService: EmailService,
    protected usersService: UserService,
  ) {}
  async passwordRecovery(email: string) {
    const user = await this.usersQueryRepository.findByLoginOrEmail(email);
    if (!user) return null;
    const recoveryCode = await this.usersService.recoveryPassword(user.id);
    return this.emailService.sendEmailWithRecoveryCode(
      user.email,
      recoveryCode,
    );
  }

  async newPassword(newPasswordDto: NewPasswordDto) {
    const user = await this.usersQueryRepository.findUserByPasswordRecoveryCode(
      newPasswordDto.recoveryCode,
    );
    if (!user) throw new BadRequestException();
    return this.authRepository.resetPasswordWithRecoveryCode(
      user.id,
      newPasswordDto.newPassword,
    );
  }
}

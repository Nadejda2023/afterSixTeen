import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthRepository } from './auth.repository';
import bcrypt from 'bcrypt';
import { NewPasswordDto } from './dto/new-password.dto';
import { Auth, AuthDocument } from '../../models/authSchemas';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { UserRepository } from '../users/users.repository';
import { UserService } from '../users/users.service';
import { EmailService } from '../../adapters/email-adapter';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { CreateUserModel, UserType } from '../../models/usersSchemas';
import { DeviceRepository } from '../device/device.repository';
import { Device } from '../../models/deviceSchemas';
import { JwtService } from './application/jwt.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: Model<AuthDocument>,
    protected usersQueryRepository: UsersQueryRepository,
    protected userRepository: UserRepository,
    protected authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    protected emailService: EmailService,
    protected usersService: UserService,
    protected userRepositoryRawSql: UserRepositoryRawSql,
    private readonly deviceRepository: DeviceRepository,
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
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
  async ressendingEmail(email: string) {
    const result =
      await this.userRepositoryRawSql.findEmailConfirmationByEmail(email);
    console.log('3', result);
    if (!result || result.isConfirmed === true) {
      throw new BadRequestException([
        {
          message: 'This email is confirmed, he can not confirmed twice',
          field: 'email',
        },
      ]);
    } else {
      const confirmationCode = randomUUID();
      const expiritionDate = add(new Date(), {
        hours: 1,
        minutes: 2,
      });
      console.log('5');
      const updateUser =
        await this.userRepositoryRawSql.updateCodeAndExpirationDate(
          result.userId,
          confirmationCode,
          expiritionDate,
        );
      console.log('updateUser', updateUser);
      await this.emailService.sendEmail(result.email, 'code', confirmationCode);
      console.log('7');
      return true;
    }
  }

  async confirmUserEmail(code: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result =
      await this.userRepositoryRawSql.findEmailConfirmationByCode(code);
    if (!result || result.isConfirmed === true) {
      throw new BadRequestException([
        {
          message: 'This code is confirmed, he can not confirmed twice',
          field: 'code',
        },
      ]);
    } else {
      const update = await this.userRepositoryRawSql.updateConfirmation(
        result.userId,
      );
      console.log('update', update);
      return true;
    }
  }

  async createUser(
    login: string,
    email: string,
    password: string,
  ): Promise<CreateUserModel> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);

    const newUser: UserType = {
      id: randomUUID(),
      login: login,
      email,
      passwordHash,
      passwordSalt,
      createdAt: new Date().toISOString(),
      recoveryCode: randomUUID(),
      emailConfirmation: {
        confirmationCode: randomUUID(),
        expirationDate: add(new Date(), {
          hours: 1,
          minutes: 2,
        }),
        isConfirmed: false,
      },
    };

    await this.userRepositoryRawSql.createUser({ ...newUser });

    try {
      this.emailService.sendEmail(
        newUser.email,
        'code',
        newUser.emailConfirmation.confirmationCode,
      );
    } catch (error) {
      console.error('create email error:', error);
    }
    return {
      id: newUser.id,
      login,
      createdAt: newUser.createdAt,
      email: newUser.email,
    };
  }

  async validateRefreshToken(token: string) {
    const isValid = await this.authRepository.validateRefreshToken(token);
    return isValid;
  }

  async _generateHash(password: string, salt: string) {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }
  async logout(token: string) {
    try {
      if (!token) {
        throw new UnauthorizedException();
      }
      const isValid = await this.authRepository.validateRefreshToken(token);

      const user = await this.usersQueryRepository.findUserById(isValid.userId);
      if (!user) throw new UnauthorizedException();

      const device = await this.deviceModel.findOne({
        deviceId: isValid.deviceId,
      });
      if (!device) {
        throw new UnauthorizedException();
      }

      const lastActiveDate = await this.jwtService.getLastActiveDate(token);
      if (lastActiveDate !== device.lastActiveDate) {
        throw new UnauthorizedException();
      }

      await this.deviceRepository.deleteDeviceId(isValid.deviceId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async refreshToken(token: string) {
    if (!token) throw new UnauthorizedException();
    try {
      //const refreshToken = req.cookies.refreshToken;
      console.log('refresh token from req:', token);
      // if (!token) {
      //   throw new UnauthorizedException();
      // }

      const isValid = await this.authRepository.validateRefreshToken(token);

      const user = await this.usersQueryRepository.findUserById(isValid.userId);
      if (!user) {
        throw new UnauthorizedException();
      }

      const device = await this.deviceModel.findOne({
        deviceId: isValid.deviceId,
      });
      if (!device) {
        throw new UnauthorizedException();
      }

      const lastActiveDate = await this.jwtService.getLastActiveDate(token);
      if (lastActiveDate !== device.lastActiveDate) {
        throw new UnauthorizedException();
      }

      const newTokens = await this.authRepository.refreshTokens(
        user.id,
        device.deviceId,
      );
      const newLastActiveDate = await this.jwtService.getLastActiveDate(
        newTokens.newRefreshToken,
      );
      await this.deviceModel.updateOne(
        { deviceId: device.deviceId },
        { $set: { lastActiveDate: newLastActiveDate } },
      ),
        res.cookie('refreshToken', newTokens.newRefreshToken, {
          httpOnly: true,
          secure: true,
        });
      return { accessToken: newTokens.accessToken };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}

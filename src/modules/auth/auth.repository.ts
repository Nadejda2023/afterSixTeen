import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthDocument, AuthViewModel } from '../../models/authSchemas';
import { EmailService } from '../../adapters/email-adapter';

import { WithId } from '../../models/postSchema';
import {
  UsersModel,
  CreateUserModel,
  UserType,
} from '../../models/usersSchemas';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { UserRepository } from '../users/users.repository';
import { refreshTokenSecret2, accessTokenSecret1 } from '../../setting';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel('Auth') private readonly AuthModel: Model<AuthDocument>,
    @InjectModel('User') private readonly UserModel: Model<UsersModel>,
    protected emailService: EmailService,
    protected userRepository: UserRepository,
    protected usersQueryRepository: UsersQueryRepository,
  ) {}

  async findMe(): Promise<WithId<AuthViewModel> | null> {
    const result: WithId<AuthViewModel> | null = await this.AuthModel.findOne(
      {},
      { projection: { _id: 0 } },
    );
    return result;
  }

  async deleteAllAuth(): Promise<boolean> {
    const result = await this.AuthModel.deleteMany({});
    return result.acknowledged === true;
  }

  async confirmEmail(code: string) {
    const user = await this.userRepository.findUserByConfirmationCode(code);
    if (!user) throw new BadRequestException('userNotExist');

    if (user.emailConfirmation.isConfirmed)
      throw new BadRequestException('codeAlreadyConfirmed');
    if (user.emailConfirmation.confirmationCode !== code)
      throw new BadRequestException('3');
    if (user.emailConfirmation.expirationDate < new Date())
      throw new BadRequestException('4');

    const result = await this.userRepository.updateConfirmation(user.id);

    return result;
  }
  async confirmUserEmail(code: string) {
    try {
      const user = await this.userRepository.findUserByConfirmationCode(code);
      if (!user) throw new BadRequestException('3');
      if (user.emailConfirmation.isConfirmed) {
        throw new BadRequestException('4');
      }
      await this.userRepository.updateConfirmation(user.id);
    } catch (error) {
      return false;
    }
    return true;
  }

  async ressendingEmail(email: string): Promise<boolean | null> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user)
      throw new BadRequestException([
        {
          message: 'this email found in base',
          field: 'email',
        },
      ]); //
    if (user.emailConfirmation.isConfirmed)
      throw new BadRequestException([
        {
          message: 'email found in base and comfirm',
          field: 'email',
        },
      ]); //

    const confirmationCode = randomUUID();
    const expiritionDate = add(new Date(), {
      hours: 1,
      minutes: 2,
    });
    await this.userRepository.updateCode(
      user.id,
      confirmationCode,
      expiritionDate,
    );

    try {
      await this.emailService.sendEmail(user.email, 'code', confirmationCode);
    } catch (error) {}

    return true;
  }

  async findUserByID(userId: string): Promise<UsersModel | null> {
    try {
      const user = await this.UserModel.findOne({ id: userId });
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async _generateHash(password: string, salt: string) {
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async validateRefreshToken(refreshToken: string): Promise<any> {
    try {
      const payload = jwt.verify(refreshToken, refreshTokenSecret2);
      console.log('refresh token secret:', refreshTokenSecret2);
      console.log('payload:', payload);
      return payload;
    } catch (error) {
      console.log('error:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateAccessToken(accessToken: string | undefined): Promise<any> {
    if (!accessToken) {
      return null;
    }
    try {
      const payload = jwt.verify(accessToken, accessTokenSecret1);
      return payload;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  async refreshTokens(
    userId: string,
    deviceId: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    try {
      const accessToken = jwt.sign({ userId }, accessTokenSecret1, {
        expiresIn: '10s',
      });
      const newRefreshToken = jwt.sign(
        { userId, deviceId }, // deviceId
        refreshTokenSecret2,
        { expiresIn: '20s' },
      );
      return { accessToken, newRefreshToken };
    } catch (error) {
      throw new Error('Failed to refresh tokens');
    }
  }

  async decodeRefreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, refreshTokenSecret2);
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async resetPasswordWithRecoveryCode(
    id: string,
    newPassword: string,
  ): Promise<any> {
    const newPaswordSalt = await bcrypt.genSalt(10);
    const newHashedPassword = await this._generateHash(
      newPassword,
      newPaswordSalt,
    );
    await this.UserModel.updateOne(
      { id },
      {
        $set: { passwordHash: newHashedPassword, passwordSalt: newPaswordSalt },
      },
    );
    return { success: true };
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

    await this.userRepository.createUser({ ...newUser });

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

  async checkCredentials(loginOrEmail: string, password: string) {
    const user =
      await this.usersQueryRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      return false;
    }
    const passwordHash = await this._generateHash(password, user.passwordSalt);
    if (user.passwordHash !== passwordHash) {
      return false;
    }

    return user;
  }
}

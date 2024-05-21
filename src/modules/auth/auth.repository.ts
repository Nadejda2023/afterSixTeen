import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthDocument, AuthViewModel } from '../../models/authSchemas';
import { EmailService } from '../../adapters/email-adapter';

import { WithId } from '../../models/postSchema';
import { UsersModel } from '../../models/usersSchemas';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { UserRepository } from '../users/users.repository';
import { refreshTokenSecret2, accessTokenSecret1 } from '../../setting';
import { DataSource } from 'typeorm';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';
import { UsersQueryRepositoryRawSql } from '../users/users.queryRepositoryRawSql';

@Injectable()
export class AuthRepository {
  constructor(
    dataSource: DataSource,
    @InjectModel('Auth') private readonly AuthModel: Model<AuthDocument>,
    @InjectModel('User') private readonly UserModel: Model<UsersModel>,
    protected emailService: EmailService,
    protected userRepository: UserRepository,
    protected userRepositoryRawSql: UserRepositoryRawSql,
    protected usersQueryRepository: UsersQueryRepository,
    protected usersQueryRepositoryRawSql: UsersQueryRepositoryRawSql,
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
        expiresIn: '10h',
      });
      const newRefreshToken = jwt.sign(
        { userId, deviceId }, // deviceId
        refreshTokenSecret2,
        { expiresIn: '20h' },
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

  async checkCredentials(loginOrEmail: string, password: string) {
    const user =
      await this.usersQueryRepositoryRawSql.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      throw new UnauthorizedException([
        {
          message: '401',
          field: 'not',
        },
      ]);
    }
    const passwordHash = await this._generateHash(password, user.passwordSalt);
    if (user.passwordHash !== passwordHash) {
      throw new UnauthorizedException([
        {
          message: '401',
          field: 'not',
        },
      ]);
    }

    return user;
  }
}

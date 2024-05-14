import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersModel } from '../../../models/usersSchemas';

import {
  accessTokenSecret1,
  refreshTokenSecret2,
  settings,
} from '../../../setting';

@Injectable()
export class JwtService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
  ) {}

  async createJWT(user: UsersModel): Promise<string> {
    const token = jwt.sign({ userId: user.id }, accessTokenSecret1, {
      expiresIn: '10h',
    });
    return token;
  }

  async createJWTRT(userId: string, deviceId: string): Promise<string> {
    const rtoken = jwt.sign({ userId, deviceId }, refreshTokenSecret2, {
      expiresIn: '20h',
    });
    return rtoken;
  }

  async getSessionAtByRefreshToken(token: string): Promise<string | null> {
    try {
      const result: any = jwt.verify(token, settings.JWT_SECRET);
      return new Date(result.iat * 1000).toISOString();
    } catch (e) {
      return null;
    }
  }

  async getLastActiveDate(token: string): Promise<string> {
    const result: any = jwt.decode(token);
    return new Date(result.iat * 1000).toISOString();
  }

  async getUserIdByToken(token: string): Promise<string | null> {
    try {
      const result: any = jwt.verify(token, settings.JWT_SECRET);
      return result.userId;
    } catch (error) {
      return null;
    }
  }

  async isTokenInvalidated(token: string): Promise<any> {
    const result = await this.userModel.findOne({ token });
    return result;
  }

  async verifyRefreshToken(
    refreshToken: string,
    refreshTokenSecret: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
        if (err) {
          reject('Invalid refresh token');
        } else {
          resolve(user);
        }
      });
    });
  }

  async verifyAccessToken(accessToken: string): Promise<any> {
    try {
      return jwt.verify(accessToken, accessTokenSecret1);
    } catch (e) {
      return null;
    }
  }
}

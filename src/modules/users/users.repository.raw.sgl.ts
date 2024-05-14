import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersModel } from '../../models/usersSchemas';
import { DataSource } from 'typeorm';

@Injectable()
export class UserRepositorySql {
  constructor(
    private readonly dataSource: DataSource,
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
  ) {}

  async deleteAllUsers(): Promise<boolean> {
    const result = await this.userModel.deleteMany({});
    return result.acknowledged === true;
  }

  async deleteUsers(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ id: id });
    return result.deletedCount === 1;
  }

  async findUserByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    return user;
  }
  async updateRecoveryPasswordInfo(userId: string, recoveryCode: string) {
    return this.userModel.updateOne(
      { userId },
      {
        $set: { recoveryCode },
      },
    );
  }

  async findByLoginU(login: string) {
    const user = await this.userModel.findOne({ login: login });
    return user;
  }

  async saveUser(user: UsersModel): Promise<UsersModel> {
    const result = await this.userModel.create(user);
    return result;
  }

  async findUserById(id: string): Promise<UsersModel | null> {
    const result = await this.userModel.findOne({ id: id });
    return result || null;
  }

  async findUserByConfirmationCode(code: string) {
    try {
      const user = await this.userModel.findOne({
        'emailConfirmation.confirmationCode': code,
      });
      return user || null;
    } catch (error) {
      console.error('Error finding user by confirmation code:', error);
      throw error;
    }
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UsersModel | null> {
    const user = await this.userModel.findOne({
      $or: [{ email: loginOrEmail }, { userName: loginOrEmail }],
    });
    return user || null;
  }
  async createUser(userDTO: UsersModel) {
    try {
      const smartUserModel = await this.dataSource.query(
        `INSERT INTO public."Users"("login", "email", "createdAt", "passwordSalt", "passwordHash", "recoveryCode")
        VALUES ($1, $2, NOW(), $3, $4, $5)
        RETURNING "id", "login", "email", "createdAt";`,
        [
          userDTO.login,
          userDTO.email,
          userDTO.createdAt,
          userDTO.passwordSalt,
          userDTO.passwordHash,
          userDTO.recoveryCode,
        ],
      );
      return smartUserModel;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  async updateConfirmation(userId: string) {
    return this.userModel.updateOne(
      { id: userId },
      { $set: { 'emailConfirmation.isConfirmed': true } },
    );
  }

  async updateCode(id: string, code: string, expirationDate: Date) {
    return this.userModel.updateOne(
      { id: id },
      {
        $set: {
          'emailConfirmation.confirmationCode': code,
          'emailConfirmation.expirationDate': expirationDate,
        },
      },
    );
  }
  async deleteAll(): Promise<boolean> {
    try {
      const result = await this.userModel.deleteMany({});

      return result.acknowledged;
    } catch (e) {
      return false;
    }
  }
}

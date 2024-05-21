import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersModel } from '../../models/usersSchemas';
import { DataSource } from 'typeorm';

@Injectable()
export class UserRepositoryRawSql {
  constructor(
    private readonly dataSource: DataSource,
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
  ) {}

  async deleteAllUsers(): Promise<boolean> {
    const result = await this.userModel.deleteMany({});
    return result.acknowledged === true;
  }

  async deleteUsers(id: string) {
    console.log('id', id);
    await this.dataSource.query(
      `DELETE FROM public."EmailConfirmation" WHERE "userId" = $1;`,
      [id],
    );

    const result = await this.dataSource.query(
      `DELETE FROM public."Users" WHERE id = $1 RETURNING *;`,
      [id],
    );

    return result.rowCount === 1;
  }

  async findUserByEmail(email: string) {
    const user = await this.dataSource.query(
      `SELECT *
        FROM public."Users"
        WHERE "email" = $1;`,
      [email],
    );
    console.log('user', user);
    if (user.length > 0) {
      return user;
    } else {
      console.log('0');
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findEmailConfirmationByEmail(email: string) {
    ///перенести в простой репозиторий и обратиться к нему через сервис
    const user = await this.dataSource.query(
      `SELECT *
      FROM public."Users" u
      LEFT JOIN "EmailConfirmation" e ON e."userId" = u."id" 
      WHERE u."email"=$1
     ;
`,
      [email],
    );
    if (user && user.length > 0) {
      return user[0];
    } else {
      return null;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findEmailConfirmationByCode(code: string) {
    const user = await this.dataSource.query(
      `SELECT *
      FROM public."Users" u
      LEFT JOIN "EmailConfirmation" e ON e."userId" = u."id" 
      WHERE e."confirmationCode"=$1
      ;
    `,
      [code],
    );
    console.log('user from 1', user);
    if (user && user.length > 0) {
      return user[0];
    } else {
      return null;
    }
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
    const user = await this.dataSource.query(
      `SELECT * FROM public."Users" WHERE "id" = $1;`,
      [id],
    );
    if (user && user.length > 0) {
      return user[0];
    } else {
      return null;
    }
  }

  async findUserByConfirmationCode(code: string) {
    const user = await this.dataSource.query(
      `SELECT *
        FROM public."Users" u
        LEFT JOIN "EmailConfirmation" e ON e."userId" = u."id"
        WHERE e."confirmationCode" = $1;`,
      [code],
    );
    if (user.length > 0) {
      return user;
    } else {
      console.log('0');
      return null;
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
      const userInsertResult = await this.dataSource.query(
        `INSERT INTO public."Users"(
          "login", "email", "createdAt", "passwordSalt", "passwordHash", "recoveryCode", "id")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;`,
        [
          userDTO.login,
          userDTO.email,
          userDTO.createdAt,
          userDTO.passwordSalt,
          userDTO.passwordHash,
          userDTO.recoveryCode,
          userDTO.id,
        ],
      );

      await this.dataSource.query(
        `INSERT INTO public."EmailConfirmation"(
          "isConfirmed", "confirmationCode", "userId", "expirationDate")
        VALUES ($1, $2, $3, $4)
        RETURNING *;`,
        [
          userDTO.emailConfirmation.isConfirmed,
          userDTO.emailConfirmation.confirmationCode,
          userDTO.id,
          userDTO.emailConfirmation.expirationDate,
        ],
      );

      return userInsertResult;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  async updateConfirmation(userId: string) {
    try {
      console.log('id:', userId);
      const result = await this.dataSource.query(
        `UPDATE "EmailConfirmation" ec
          SET "isConfirmed" = true
          WHERE ec."userId" = $1;`,
        [userId],
      );
      console.log('Update result:', result);
      return result;
    } catch (error) {
      console.error('Error updating confirmation:', error);
      throw new Error('Failed to update confirmation');
    }
  }
  async updateCodeAndExpirationDate(
    id: string,
    code: string,
    expirationDate: Date,
  ) {
    return await this.dataSource.query(
      `UPDATE "EmailConfirmation" ec 
      SET "confirmationCode" = $1, "expirationDate" = $2
      WHERE ec."userId" = $3
      ;`,
      [code, expirationDate, id],
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

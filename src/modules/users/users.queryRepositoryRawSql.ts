import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  PaginatedUser,
  UserDocument,
  UserViewModel,
  UsersModel,
} from '../../models/usersSchemas';
import { TUsersPagination } from '../../hellpers/pagination';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UsersQueryRepositoryRawSql {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findUserByPasswordRecoveryCode(
    recoveryCode: string,
  ): Promise<UsersModel | null> {
    return this.userModel.findOne({ recoveryCode });
  }

  async findUsers(
    pagination: TUsersPagination,
  ): Promise<PaginatedUser<UserViewModel>> {
    const countQuery = `
        SELECT COUNT(*)
        FROM public."Users"
        WHERE "email" ILIKE $1 OR "login" ILIKE $2;
      `;

    const countParams = [
      `%${pagination.searchEmailTerm}%`,
      `%${pagination.searchLoginTerm}%`,
    ];

    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalCount: number = parseInt(countResult[0].count);

    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const query = `
      SELECT "id", "login", "email", "createdAt"
      FROM public."Users"
      WHERE "email" ILIKE $1 OR "login" ILIKE $2
      ORDER BY "${pagination.sortBy}" ${pagination.sortDirection}
      OFFSET $3
      LIMIT $4;
      `;

    const params = [
      `%${pagination.searchEmailTerm}%`,
      `%${pagination.searchLoginTerm}%`,
      //pagination.sortDirection,
      pagination.skip,
      pagination.pageSize,
    ];

    const result = await this.dataSource.query(query, params);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map(
        (user) =>
          new UserViewModel(user.id, user.login, user.email, user.createdAt),
      ),
    };
  }

  async findUserById(id: string): Promise<UsersModel | null> {
    const foundedUser = await this.userModel.findOne(
      { id: id },
      {
        passwordSalt: 0,
        passwordHash: 0,
        emailConfirmation: 0,
        refreshTokenBlackList: 0,
      },
    );

    if (!foundedUser) {
      return null;
    }
    return foundedUser;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UsersModel | null> {
    const user = await this.dataSource.query(
      `SELECT login, email, "createdAt", "passwordSalt", "passwordHash", "recoveryCode", id
    FROM public."Users"
    WHERE "login"= $1 OR "email"=$1;`,
      [loginOrEmail],
    );
    if (user && user.length > 0) {
      return user[0];
    } else {
      return null;
    }
  }
  async findByLogin(login: string): Promise<UsersModel | null> {
    const user = await this.dataSource.query(
      `SELECT login, email, "createdAt", "passwordSalt", "passwordHash", "recoveryCode", id
    FROM public."Users"
    WHERE "login"= $1;`,
      [login],
    );
    if (user && user.length > 0) {
      return user[0];
    } else {
      return null;
    }
  }
  async findUserByEmail(email: string): Promise<UsersModel | null> {
    const user = await this.dataSource.query(
      `SELECT login, email, "createdAt", "passwordSalt", "passwordHash", "recoveryCode", id
    FROM public."Users"
    WHERE "email"= $1;`,
      [email],
    );
    if (user && user.length > 0) {
      return user[0];
    } else {
      return null;
    }
  }

  async findTokenInBL(userId: string, token: string): Promise<boolean> {
    const userByToken = await this.userModel.findOne({
      id: userId,
      refreshTokenBlackList: { $in: [token] },
    });
    return !!userByToken;
  }

  async findUserByToken(refreshToken: string): Promise<UsersModel | null> {
    const foundedUser = await this.userModel.findOne(
      { refreshToken: refreshToken },
      {
        passwordSalt: 0,
        passwordHash: 0,
        emailConfirmation: 0,
        refreshTokenBlackList: 0,
      },
    );
    return foundedUser;
  }
}

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
    try {
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
        ORDER BY ${pagination.sortBy} ${pagination.sortDirection}
        OFFSET $3
        LIMIT $4;
      `;

      const params = [
        `%${pagination.searchEmailTerm}%`,
        `%${pagination.searchLoginTerm}%`,
        pagination.skip,
        pagination.pageSize,
      ];

      const result = await this.dataSource.query(query, params);

      const userViewModels: UserViewModel[] = result.map(
        (row) => new UserViewModel(row.Id, row.Login, row.Email, row.CreatedAt),
      );

      return {
        pagesCount: pageCount,
        page: pagination.pageNumber,
        pageSize: pagination.pageSize,
        totalCount: totalCount,
        items: userViewModels,
      };
    } catch (error) {
      console.error('Error finding users:', error);
      throw error;
    }
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
    const user = await this.userModel.findOne({
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });
    return user;
  }
  async findByLogin(login: string): Promise<UsersModel | null> {
    const user = await this.userModel.findOne({ login: login });
    return user;
  }
  async findUserByEmail(email: string): Promise<UsersModel | null> {
    const user = await this.userModel.findOne({ email: email });
    return user;
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

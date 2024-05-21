import { Injectable } from '@nestjs/common';
import {
  //ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersQueryRepository } from '../modules/users/users.queryRepository';
import { UsersQueryRepositoryRawSql } from '../modules/users/users.queryRepositoryRawSql';

@ValidatorConstraint({ name: 'UserLoginExists', async: true })
@Injectable()
export class UserLoginExistsValidator implements ValidatorConstraintInterface {
  constructor(
    private readonly userQueryRepository: UsersQueryRepository,
    protected userQueryRepositoryRawSql: UsersQueryRepositoryRawSql,
  ) {}

  async validate(login: string) {
    try {
      const user = await this.userQueryRepositoryRawSql.findByLogin(login);
      if (user) {
        return false;
      } else {
        return true;
      } // Вернуть true, если пользователь не найден
    } catch (e) {
      return false;
    }
  }

  // defaultMessage(args: ValidationArguments) {
  //   const fieldName = args.property;
  //   return `This login already exists: ${fieldName}`;
  // }
}

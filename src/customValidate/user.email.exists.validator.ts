import { Injectable } from '@nestjs/common';

import {
  //ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersQueryRepository } from '../modules/users/users.queryRepository';
import { UsersQueryRepositoryRawSql } from '../modules/users/users.queryRepositoryRawSql';

@ValidatorConstraint({ name: 'UserEmailExists', async: true })
@Injectable()
export class UserEmailExistsValidator implements ValidatorConstraintInterface {
  constructor(
    private readonly userQueryRepository: UsersQueryRepository,
    protected userQueryRepositoryRawSql: UsersQueryRepositoryRawSql,
  ) {}
  async validate(email: string) {
    try {
      const user = await this.userQueryRepositoryRawSql.findUserByEmail(email);
      if (user) {
        return false;
      } else {
        return true;
      } // Вернуть true, если пользователь не найден
    } catch (e) {
      return false;
    }
  }

  //   defaultMessage(args: ValidationArguments) {
  //     const fieldName = args.property;
  //     return `This login already exists: ${fieldName}`;
  //   }
}

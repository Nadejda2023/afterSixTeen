import { Injectable } from '@nestjs/common';
import {
  //ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersQueryRepository } from '../modules/users/users.queryRepository';

@ValidatorConstraint({ name: 'UserLoginExists', async: true })
@Injectable()
export class UserLoginExistsValidator implements ValidatorConstraintInterface {
  constructor(private readonly userQueryRepository: UsersQueryRepository) {}
  debugger;
  async validate(login: string) {
    try {
      const user = await this.userQueryRepository.findByLogin(login);
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

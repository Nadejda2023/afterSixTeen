import { ValidationOptions, registerDecorator } from 'class-validator';
import { UserLoginExistsValidator } from '../../../customValidate/user.login.exist.valdator';

export function UserLoginExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'UserLoginExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UserLoginExistsValidator,
    });
  };
}

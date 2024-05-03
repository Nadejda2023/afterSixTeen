import { ValidationOptions, registerDecorator } from 'class-validator';
import { UserEmailExistsValidator } from '../../../customValidate/user.email.exists.validator';

export function UserEmailExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'UserEmailExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UserEmailExistsValidator,
    });
  };
}

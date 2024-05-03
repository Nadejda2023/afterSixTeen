import { ValidationOptions, registerDecorator } from 'class-validator';
import { BlogIdExistsValidator } from '../../../customValidate/blog.id.custom.validator';

export function BlogIdExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'BlogIdExist',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: BlogIdExistsValidator,
    });
  };
}

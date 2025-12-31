import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as zxcvbn from 'zxcvbn';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const result = zxcvbn(value);
          return result.score >= 3; // Score 3 or higher (good or strong)
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password is too weak. Please use a stronger password with a mix of uppercase, lowercase, numbers, and symbols.';
        },
      },
    });
  };
}

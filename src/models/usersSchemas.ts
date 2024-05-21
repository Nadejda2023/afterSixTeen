import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  passwordSalt: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  recoveryCode?: string;

  @Prop({
    required: true,
    type: {
      isConfirmed: Boolean,
      confirmationCode: String,
      expirationDate: Date,
    },
  })
  emailConfirmation: EmailConfirmationType;
}

export const UserSchema = SchemaFactory.createForClass(User);

export class UserSql {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
  recoveryCode?: string;
  emailConfirmation: EmailConfirmationType;
}
export class EmailConfirmationSql {
  id: string;
  isConfirmed: boolean;
  confirmationCode: string;
  expirationDate: Date;
  userId: number;
}

export type PaginatedUser<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type UsersModelSw = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};
export class UserType {
  constructor(
    public id: string,
    public login: string,
    public email: string,
    public createdAt: string,
    public passwordSalt: string,
    public passwordHash: string,
    public emailConfirmation: EmailConfirmationType,
    public recoveryCode?: string | undefined,
  ) {}
}
export class UserViewModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  constructor(id: string, login: string, email: string, createdAt: string) {
    this.id = id;
    this.login = login;
    this.email = email;
    this.createdAt = createdAt;
  }
}

export type UsersModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
  recoveryCode?: string | undefined;
  emailConfirmation: EmailConfirmationType;
  //refreshTokenBlackList: string[]
};

export type EmailConfirmationType = {
  // usera
  isConfirmed: boolean;
  confirmationCode: string;
  expirationDate: Date;
};

export type CreateUserModel = {
  id: string;
  login: string;
  createdAt: string;
  email: string;
};

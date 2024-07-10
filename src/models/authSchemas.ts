import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LoginInputModel = {
  loginOrEmail: string;
  password: string;
};

export type AuthViewModel = {
  email: string;
  login: string;
  userId: string;
};

export type payloadA = {
  userId: string;
  deviceId: string;
  iat: number;
  exp: number;
};

// export type payloadR = {
//   refreshToken: string;
//   deviceId: string;
//   userId: string;
//   expiresIn: string;
//   refreshTokenSecret2: string;
// };
export class AuthViewModelType {
  constructor(
    public email: string,
    public login: string,
    public userId: string,
  ) {}
}
export class AuthSql {
  id: number;
  email: string;
  login: string;
  userId: number; //FK id User
}

export type AuthDocument = HydratedDocument<Auth>;
@Schema()
export class Auth {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  userId: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);

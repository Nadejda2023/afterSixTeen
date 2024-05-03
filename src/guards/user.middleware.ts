import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../models/usersSchemas';
import { JwtService } from '../modules/auth/application/jwt.service';
@Injectable()
export class UserSoftGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private usersModel: Model<UserDocument>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer')) {
      return true; // Пропускаем запрос, если отсутствует заголовок Authorization или токен
    }

    const token = authorization.split(' ')[1];
    const userId = await this.jwtService.getUserIdByToken(token);

    if (!userId) {
      return true; // Пропускаем запрос, если не удалось получить ID пользователя из токена
    }

    const user = await this.usersModel.findOne({ id: userId });

    if (user) {
      request.user = user; // Устанавливаем пользователя в объекте запроса
    }

    return true; // Пропускаем запрос
  }
}

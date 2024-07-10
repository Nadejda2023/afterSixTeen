import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../models/usersSchemas';
import { JwtService } from '../modules/auth/application/jwt.service';

@Injectable()
export class AuthGuardRawSql implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private usersModel: Model<UserDocument>,
    //@InjectDataSource() private readonly dataSource: DataSource,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authorization.split(' ')[1];
    const userId = await this.jwtService.getUserIdByToken(token);

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const jwtPayload = await this.jwtService.verifyAccessToken(token);
    if (!jwtPayload) throw new UnauthorizedException();

    // const user = await this.dataSource.query(
    //   `SELECT email, login, id, "userId"
    //   FROM public."Auth" WHERE "userId" = $1;`,
    //   [userId],
    // );
    const user = await this.usersModel.findOne({ id: userId }, { _id: false });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;
    console.log('user from authGuard :', user);
    return true;
  }
}

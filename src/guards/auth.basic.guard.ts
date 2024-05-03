import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization;

    if (!auth) {
      throw new UnauthorizedException();
    }

    const [authType, authData] = auth.split(' ');

    if (authType !== 'Basic' || authData !== 'YWRtaW46cXdlcnR5') {
      throw new UnauthorizedException();
    }

    return true;
  }
}

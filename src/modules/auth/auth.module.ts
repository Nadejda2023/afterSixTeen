import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../../adapters/email-adapter';
import { DeviceRepository } from '../device/device.repository';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { UsersQueryRepositoryRawSql } from '../users/users.queryRepositoryRawSql';
import { UserRepository } from '../users/users.repository';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    DeviceRepository,
    EmailService,
    UserRepository,
    UsersQueryRepository,
    UsersQueryRepositoryRawSql,
    UserRepositoryRawSql,
  ],
  imports: [
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN || 'Secret',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
})
export class AuthModule {}

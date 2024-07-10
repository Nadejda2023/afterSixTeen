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
import { JwtService } from './application/jwt.service';
import { DeviceService } from '../device/device.service';
import { UserService } from '../users/users.service';
import { DeviceRepositoryRawSQL } from '../device/device.repository.rawSql';
import { AuthRepositoryRawSql } from './auth.repository.rawsql';

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
    JwtService,
    DeviceService,
    UserService,
    DeviceRepository,
    DeviceRepositoryRawSQL,
    AuthRepositoryRawSql,
  ],
  imports: [
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN || 'Secret',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
  exports: [JwtService],
})
export class AuthModule {}

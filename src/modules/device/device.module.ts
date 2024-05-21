import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { DeviceRepository } from './device.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from '../../models/deviceSchemas';
import { EmailService } from '../../adapters/email-adapter';
import { Auth, AuthSchema } from '../../models/authSchemas';
import { User, UserSchema } from '../../models/usersSchemas';
import { AuthRepository } from '../auth/auth.repository';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { UserRepository } from '../users/users.repository';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';
import { UsersQueryRepositoryRawSql } from '../users/users.queryRepositoryRawSql';

const schemas = [
  { name: Device.name, schema: DeviceSchema },
  { name: Auth.name, schema: AuthSchema },
  { name: User.name, schema: UserSchema },
];
@Module({
  imports: [MongooseModule.forFeature(schemas)],
  controllers: [DeviceController],
  providers: [
    DeviceService,
    AuthRepository,
    DeviceRepository,
    EmailService,
    UserRepository,
    UsersQueryRepository,
    UsersQueryRepositoryRawSql,
    UserRepositoryRawSql,
  ],
  exports: [DeviceService, AuthRepository, DeviceRepository],
})
export class DeviceModule {}

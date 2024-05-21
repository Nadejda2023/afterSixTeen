import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDocument } from '../../models/deviceSchemas';
import { AuthRepository } from '../auth/auth.repository';
import { Device } from './entities/device.entity';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    protected authRepository: AuthRepository,
    protected userRepositoryRawSql: UserRepositoryRawSql,
  ) {}
}

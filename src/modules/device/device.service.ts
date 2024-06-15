import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDbModel, DeviceDocument } from '../../models/deviceSchemas';
import { AuthRepository } from '../auth/auth.repository';
import { Device } from './entities/device.entity';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';
import { JwtService } from '../auth/application/jwt.service';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    protected authRepository: AuthRepository,
    protected userRepositoryRawSql: UserRepositoryRawSql,
    private readonly jwtService: JwtService,
  ) {}

  async findDevice(isValid: any): Promise<DeviceDbModel> {
    const device = await this.deviceModel.findOne({
      deviceId: isValid.deviceId,
    });
    if (!device) {
      throw new UnauthorizedException();
    }

    return device;
  }

  async findDeviceLastActiveDate(token: string, device: DeviceDbModel) {
    const lastActiveDate = await this.jwtService.getLastActiveDate(token);
    if (lastActiveDate !== device.lastActiveDate) {
      throw new UnauthorizedException();
    }
    return lastActiveDate;
  }
}

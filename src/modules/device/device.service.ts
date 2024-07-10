import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDbModel, DeviceDocument } from '../../models/deviceSchemas';
import { AuthRepository } from '../auth/auth.repository';
import { Device } from './entities/device.entity';
import { UserRepositoryRawSql } from '../users/users.repository.raw.sgl';
import { JwtService } from '../auth/application/jwt.service';
import { DeviceRepository } from './device.repository';
import { DeviceRepositoryRawSQL } from './device.repository.rawSql';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    protected authRepository: AuthRepository,
    protected userRepositoryRawSql: UserRepositoryRawSql,
    private readonly jwtService: JwtService,
    protected deviceRepository: DeviceRepository,
    protected deviceRepositoryRawSql: DeviceRepositoryRawSQL,
  ) {}

  async findDeviceByValidToken(deviceId: string): Promise<DeviceDbModel> {
    const device =
      await this.deviceRepositoryRawSql.findDeviceByValidToken(deviceId);
    if (!device) {
      throw new UnauthorizedException();
    }

    return device;
  }

  async setDevice(newDevice: DeviceDbModel) {
    const setDevice = await this.deviceRepositoryRawSql.updateDevice(newDevice);
    return setDevice;
  }

  async updateDevice(deviceId: string, newLastActiveDate: string) {
    const result = await this.deviceRepositoryRawSql.updateLastDevice(
      deviceId,
      newLastActiveDate,
    );
    return result;
  }
  async findDeviceLastActiveDate(token: string, device: DeviceDbModel) {
    const lastActiveDate = await this.jwtService.getLastActiveDate(token);
    if (lastActiveDate !== device.lastActiveDate) {
      throw new UnauthorizedException();
    }
    return lastActiveDate;
  }

  async getAllDeviceByUserId(userId: string): Promise<DeviceDbModel[]> {
    const foundDevices =
      await this.deviceRepositoryRawSql.getAllDeviceByUserId(userId);
    return foundDevices;
  }

  async validateRefreshToken(token: string) {
    const isValid = await this.authRepository.validateRefreshToken(token);
    if (!isValid) {
      throw new UnauthorizedException();
    }
    return isValid;
  }

  async deleteAllExceptOne(userId: string, deviceId: string) {
    const res = await this.deviceRepositoryRawSql.deleteAllExceptOne(
      userId,
      deviceId,
    );
    return res;
  }

  async deleteDeviceById(deviceId: string) {
    const res = await this.deviceRepositoryRawSql.deleteDeviceId(deviceId);
    return res;
  }

  async validateRefreshForDevice(token: string) {
    const isValid = await this.authRepository.validateRefreshToken(token);
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      throw new UnauthorizedException();
    }

    const user = await this.authRepository.findUserByID(isValid.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const device = await this.deviceRepository.findDeviceById(isValid.deviceId);
    if (!device) {
      throw new NotFoundException(`Device not found`);
    }

    if (device.userId !== isValid.userId) {
      throw new ForbiddenException('this resource is forbidden');
    }

    return isValid;
  }
}

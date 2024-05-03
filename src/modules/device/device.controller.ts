import {
  Controller,
  Get,
  Delete,
  UnauthorizedException,
  HttpCode,
  Param,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceRepository } from './device.repository';
import { AuthRepository } from '../auth/auth.repository';
import { RefreshToken } from '../auth/decorators/refresh-token.decoratoes';

@Controller('/security/devices')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    protected deviceRepository: DeviceRepository,
    protected authRepository: AuthRepository,
  ) {}
  @Get('')
  async getDeviceByUserId(@RefreshToken() token: string) {
    if (!token) throw new UnauthorizedException();
    try {
      console.log('refresh token from  req DEVICE:', token);
      const isValid = await this.authRepository.validateRefreshToken(token);

      if (!isValid || !isValid.userId || !isValid.deviceId) {
        throw new UnauthorizedException();
      }
      const user = await this.authRepository.findUserByID(isValid.userId);

      if (!user) {
        throw new UnauthorizedException();
      }

      const device = await this.deviceRepository.findDeviceById(
        isValid.deviceId,
      );
      if (!device) {
        throw new UnauthorizedException();
      }

      if (isValid.userId !== device.userId) {
        throw new UnauthorizedException();
      }

      const foundDevices = await this.deviceRepository.getAllDeviceByUserId(
        isValid.userId,
      );
      if (!foundDevices) {
        throw new NotFoundException();
      }
      const devices = foundDevices.map((device) => ({
        ip: device.ip,
        title: device.title,
        lastActiveDate: device.lastActiveDate,
        deviceId: device.deviceId,
      }));

      return devices;
    } catch {
      throw new UnauthorizedException();
    }
  }
  @Delete('')
  @HttpCode(204)
  async deleteAllDeviceExceptOneDevice(@RefreshToken() token: string) {
    const isValid = await this.authRepository.validateRefreshToken(token);
    // if (!isValid || !isValid.userId || !isValid.deviceId) {
    //   throw new UnauthorizedException();
    // }

    return await this.deviceRepository.deleteAllExceptOne(
      isValid.userId,
      isValid.deviceId,
    ); // delete({userId, $..: deviceId})
  }
  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDeviceById(
    @RefreshToken() token: string,
    @Param('deviceId') deviceId: string,
  ) {
    const isValid = await this.authRepository.validateRefreshToken(token);
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      throw new UnauthorizedException();
    }

    const user = await this.authRepository.findUserByID(isValid.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const device = await this.deviceRepository.findDeviceById(deviceId); //
    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} not found`);
    }

    if (device.userId !== isValid.userId) {
      throw new ForbiddenException('this resource is forbidden');
    }

    return await this.deviceRepository.deleteDeviceId(deviceId);
  }
}

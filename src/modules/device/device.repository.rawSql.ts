import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DataSource } from 'typeorm';
import { DeviceDbModel } from '../../models/deviceSchemas';
import { Device } from './entities/device.entity';

@Injectable()
export class DeviceRepositoryRawSQL {
  constructor(
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}
  async findDeviceById(deviceId: string): Promise<DeviceDbModel | null> {
    try {
      const device = await this.dataSource.query(
        `SELECT ip, title, "lastActiveDate", "deviceId", id, "userId"
      FROM public."Device"
      WHERE id = $1;`,
        [deviceId],
      );
      return device;
    } catch (error) {
      console.error('Error finding device by ID:', error);
      return null;
    }
  }

  async updateDevice(newDevice: DeviceDbModel) {
    const { ip, title, lastActiveDate, deviceId, userId } = newDevice;
    const result = await this.dataSource.query(
      `UPDATE public."Device"
      SET ip=$1, title=$2, "lastActiveDate"=$3, "deviceId"=$4,  "userId"=$5;`,
      [ip, title, lastActiveDate, deviceId, userId],
    );
    console.log('rwsult device:', result);
    return result;
  }

  async deleteAllExceptOne(userId: string, deviceId: string): Promise<boolean> {
    try {
      await this.dataSource.query(``, [deviceId]); // to do
      // await this.deviceModel.deleteMany({
      //   userId,
      //   deviceId: { $ne: deviceId },
      // });

      return true;
    } catch (error) {
      throw new Error('Failed to refresh tokens');
    }
  }
  async getDeviceByUserId(
    userId: string,
    deviceId: string,
  ): Promise<DeviceDbModel | null> {
    try {
      const device = await this.dataSource.query(``, [userId, deviceId]); // { projection: { _id: 0, userId: 0 } },
      return device;
    } catch (error) {
      console.error('Error getting device by user ID:', error);
      return null;
    }
  }
  async getAllDeviceByUserId(userId: string): Promise<DeviceDbModel[]> {
    // const device: DeviceDbModel[] = await this.deviceModel
    //   .find({ userId }, { projection: { _id: 0, userId: 0 } })
    //   .lean();
    const device = await this.dataSource.query(``, [userId]);
    if (!device) {
      throw new NotFoundException();
    }
    return device;
  }

  async deleteDeviceId(deviceId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM public."Device"
    WHERE id = $1;`,
      [deviceId],
    );

    if (!result) {
      throw new NotFoundException(`with ID ${deviceId} not found`);
    }
    return true;
  }

  async findDeviceByValidToken(
    deviceId: string,
  ): Promise<DeviceDbModel | null> {
    const device = await this.dataSource.query(
      `SELECT ip, title, "lastActiveDate", "deviceId", id, "userId"
        FROM public."Device" WHERE "deviceId" = $1;`,
      [deviceId],
    );

    if (device && device.length > 0) {
      console.log('Device found:', device[0]);
      return device[0];
    } else {
      return null;
    }
  }

  async updateLastDevice(deviceId: string, newLastActiveDate: string) {
    try {
      const result = await this.dataSource.query(
        `UPDATE public."Device"
        SET "lastActiveDate" = $1
        WHERE "deviceId" = $2;`,
        [newLastActiveDate, deviceId],
      );
      return result;
    } catch (error) {
      console.error('Error updating confirmation:', error);
      return null;
    }
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UsersModel } from './usersSchemas';

export type DeviceDbModel = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
  userId: string;
};

export class DeviceSql {
  id: number;
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: number;
  userId: number; // FK id user
}
export class DeviceModel {
  ///тот самый тип который был с длинным названием

  constructor(
    public ip: string,
    public title: string,
    public lastActiveDate: string,
    public deviceId: string,
    public userId: string,
  ) {}
  static getViewModel(
    user: UsersModel | null,
    device: DeviceDbModel,
  ): DeviceViewModel {
    return {
      ip: device.ip,
      title: device.title,
      lastActiveDate: device.lastActiveDate,
      deviceId: device.deviceId,
    };
  }
}

export type DeviceViewModel = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
};
export type DeviceDocument = HydratedDocument<Device>;
@Schema()
export class Device {
  @Prop({ required: true })
  ip: string;
  @Prop({ required: true })
  title: string;
  @Prop({ required: true })
  lastActiveDate: string;
  @Prop({ required: true })
  deviceId: string;
  @Prop({ required: true })
  userId: string;
}
export const DeviceSchema = SchemaFactory.createForClass(Device);

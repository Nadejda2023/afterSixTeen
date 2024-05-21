import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegistrationEmailResendingDto } from './dto/registration-email-resending.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { RegistrationConfirmationDto } from './dto/registration-confirmation.dto';
import { JwtService } from './application/jwt.service';
import { AuthGuard } from '../../guards/auth.middleware';
import { UsersValidateDto } from '../../models/input/user.customvalidate.dto';
import { User } from '../../models/usersSchemas';
import { UsersQueryRepository } from '../users/users.queryRepository';
import { Device, DeviceDbModel } from '../../models/deviceSchemas';
import { DeviceRepository } from '../device/device.repository';
import { UserDecorator } from '../../infastructure/decorators/param/user.decorator';
import { AuthService } from './auth.service';
import { RefreshToken } from './decorators/refresh-token.decoratoes';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly authRepository: AuthRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    @InjectModel('Device') private readonly deviceModel: Model<Device>,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @UseGuards(ThrottlerGuard)
  @Post('/login')
  @HttpCode(200)
  async createAuthUser(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const user = await this.authRepository.checkCredentials(
      loginDto.loginOrEmail,
      loginDto.password,
    );
    if (user) {
      const deviceId = randomUUID();
      const userId = user.id;
      const accessToken = await this.jwtService.createJWT(user);
      const refreshToken = await this.jwtService.createJWTRT(userId, deviceId);
      const lastActiveDate =
        await this.jwtService.getLastActiveDate(refreshToken);
      const newDevice: DeviceDbModel = {
        ip: ip,
        title: req.headers['user-agent'] || 'title',
        lastActiveDate,
        deviceId,
        userId,
      };
      await this.deviceModel.insertMany([newDevice]);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
      });

      return { accessToken };
    } else {
      throw new UnauthorizedException([
        {
          message: '401',
          field: 'not',
        },
      ]);
    }
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @UseGuards(ThrottlerGuard)
  @Post('password-recovery')
  @HttpCode(204)
  async passwordRecovery(@Body() recoveryPasswordDto: RecoveryPasswordDto) {
    return this.authService.passwordRecovery(recoveryPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @UseGuards(ThrottlerGuard)
  @Post('new-password')
  @HttpCode(204)
  async newPassword(@Body() newPasswordDto: NewPasswordDto) {
    return this.authService.newPassword(newPasswordDto);
  }

  @Post('refresh-token')
  @HttpCode(200)
  async createRefreshToken(
    @RefreshToken() token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) throw new UnauthorizedException();
    try {
      //const refreshToken = req.cookies.refreshToken;
      console.log('refresh token from req:', token);
      // if (!token) {
      //   throw new UnauthorizedException();
      // }

      const isValid = await this.authRepository.validateRefreshToken(token);

      const user = await this.usersQueryRepository.findUserById(isValid.userId);
      if (!user) {
        throw new UnauthorizedException();
      }

      const device = await this.deviceModel.findOne({
        deviceId: isValid.deviceId,
      });
      if (!device) {
        throw new UnauthorizedException();
      }

      const lastActiveDate = await this.jwtService.getLastActiveDate(token);
      if (lastActiveDate !== device.lastActiveDate) {
        throw new UnauthorizedException();
      }

      const newTokens = await this.authRepository.refreshTokens(
        user.id,
        device.deviceId,
      );
      const newLastActiveDate = await this.jwtService.getLastActiveDate(
        newTokens.newRefreshToken,
      );
      await this.deviceModel.updateOne(
        { deviceId: device.deviceId },
        { $set: { lastActiveDate: newLastActiveDate } },
      ),
        res.cookie('refreshToken', newTokens.newRefreshToken, {
          httpOnly: true,
          secure: true,
        });
      return { accessToken: newTokens.accessToken };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @UseGuards(ThrottlerGuard)
  @Post('registration-confirmation')
  @HttpCode(204)
  async createRegistrationConfirmation(
    @Body() registrationConfirmationDto: RegistrationConfirmationDto,
  ) {
    console.log(
      'registrationConfirmationDto.code',
      registrationConfirmationDto.code,
    );
    return await this.authRepository.confirmUserEmail(
      registrationConfirmationDto.code,
    );

    // if (!result) {
    //   throw new BadRequestException([
    //     {
    //       message: 'some error occured',
    //       field: 'code',
    //     },
    //   ]);
    // }
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @UseGuards(ThrottlerGuard)
  @Post('registration')
  @HttpCode(204)
  async createRegistration(@Body() createUserDto: UsersValidateDto) {
    // to do UserDto
    return this.authRepository.createUser(
      createUserDto.login,
      createUserDto.email,
      createUserDto.password,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @UseGuards(ThrottlerGuard)
  @Post('registration-email-resending')
  @HttpCode(204)
  async createRegistrationEmailResending(
    @Body() registrationEmailResendingDto: RegistrationEmailResendingDto,
  ) {
    return this.authRepository.ressendingEmail(
      //запросы к сервису, отрефактори
      registrationEmailResendingDto.email,
    );
  }

  @Post('logout')
  @HttpCode(204)
  async createUserLogout(
    @RefreshToken() token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      //const refreshToken = req.cookies.refreshToken;
      if (!token) {
        throw new UnauthorizedException();
      }
      const isValid = await this.authRepository.validateRefreshToken(token);

      const user = await this.usersQueryRepository.findUserById(isValid.userId);
      if (!user) throw new UnauthorizedException();

      const device = await this.deviceModel.findOne({
        deviceId: isValid.deviceId,
      });
      if (!device) {
        throw new UnauthorizedException();
      }

      const lastActiveDate = await this.jwtService.getLastActiveDate(token);
      if (lastActiveDate !== device.lastActiveDate) {
        throw new UnauthorizedException();
      }

      await this.deviceRepository.deleteDeviceId(isValid.deviceId);

      res.clearCookie('refreshToken', { httpOnly: true, secure: true });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async createUserMe(
    @UserDecorator() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!user) {
      throw new UnauthorizedException([
        {
          message: '401',
          field: 'not',
        },
      ]);
    } else {
      return res.status(200).send({
        email: user.email,
        login: user.login,
        userId: user.id,
      });
    }
  }
}

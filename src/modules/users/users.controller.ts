import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './users.service';
import { UsersQueryRepository } from './users.queryRepository';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRepository } from './users.repository';
import { PaginatedUser, UserViewModel } from '../../models/usersSchemas';
import { AuthorizationGuard } from '../../guards/auth.basic.guard';
import { UsersInputDto } from '../../models/input/create-user.input-dto';
import { getUsersPagination } from '../../hellpers/pagination';
@SkipThrottle()
@UseGuards(AuthorizationGuard)
@Controller('users')
export class UsersController {
  constructor(
    protected usersService: UserService,
    protected usersQueryRepository: UsersQueryRepository,
    protected usersRepository: UserRepository,
  ) {}
  @UseGuards(AuthorizationGuard)
  @Post()
  @HttpCode(201)
  async createUser(@Body() inputModel: UsersInputDto, @Req() req, @Res() res) {
    //const { login, email, password } = inputModel;
    const newUser = await this.usersService.createUser(inputModel);

    if (!newUser) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    return res.status(HttpStatus.CREATED).json(newUser);
  }

  @Get()
  async getUsers(@Query() query, @Res() res): Promise<void> {
    const pagination = getUsersPagination(query);
    const foundAllUsers: PaginatedUser<UserViewModel> =
      await this.usersQueryRepository.findUsers(pagination);

    res.status(HttpStatus.OK).json(foundAllUsers);
  }
  @UseGuards(AuthorizationGuard)
  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: string, @Res() res): Promise<void> {
    const isDeleted = await this.usersService.deleteUserById(id);

    if (isDeleted) {
      res.status(HttpStatus.NO_CONTENT).send();
    } else {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}

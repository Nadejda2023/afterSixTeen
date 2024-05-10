import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { ConfigModule } from '@nestjs/config';
import { UsersController } from './modules/users/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSchema, Blogs } from './models/blogSchems';
import { BlogService } from './modules/blogs/blogs.service';
import { BlogsController } from './modules/blogs/blogs.controller';
import { BlogsRepository } from './modules/blogs/blogs.repository';
import { BlogQueryRepo } from './modules/blogs/blogs.query-repository';
import { Posts, PostSchema } from './models/postSchema';
import { User, UserSchema } from './models/usersSchemas';
import { Comment, CommentSchema } from './models/commentSchemas';
import { PostsController } from './modules/posts/posts.controller';
import { PostService } from './modules/posts/posts.service';
import { PostsQueryRepository } from './modules/posts/posts.query-repository';
import { PostsRepository } from './modules/posts/posts.repository';
import { CommentController } from './modules/comment/comment.controller';
import { CommentService } from './modules/comment/comment.service';
import { UsersQueryRepository } from './modules/users/users.queryRepository';
import { UserRepository } from './modules/users/users.repository';
import { UserService } from './modules/users/users.service';
import { EmailService } from './adapters/email-adapter';
import { CommentRepository } from './modules/comment/comment.repository';
import { TestingService } from './Test-All-Data/testing.service';
import { TestingRepository } from './Test-All-Data/test-all-data.repository';
import { TestingController } from './Test-All-Data/testing.controller';
import { AuthService } from './modules/auth/auth.service';
import { AuthRepository } from './modules/auth/auth.repository';
import { AuthController } from './modules/auth/auth.controller';
import { AuthGuard } from './guards/auth.middleware';
import { Auth, AuthSchema } from './models/authSchemas';
import { JwtService } from './modules/auth/application/jwt.service';
import { AuthorizationGuard } from './guards/auth.basic.guard';
import { UserEmailExistsValidator } from './customValidate/user.email.exists.validator';
import { UserLoginExistsValidator } from './customValidate/user.login.exist.valdator';
import { ThrottlerModule } from '@nestjs/throttler';
import { DeviceModule } from './modules/device/device.module';
import { Device, DeviceSchema } from './models/deviceSchemas';
import { DeviceService } from './modules/device/device.service';
import { DeviceController } from './modules/device/device.controller';
import { DeviceRepository } from './modules/device/device.repository';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration/configuration';
import { UpdatePostLikeStatusUseCase } from './modules/posts/usecase/post_like_status_use_case';
import { CqrsModule } from '@nestjs/cqrs';
import { UserSoftGuard } from './guards/user.middleware';
import { BlogIdExistsValidator } from './customValidate/blog.id.custom.validator';
import { TypeOrmModule } from '@nestjs/typeorm';

//dotenv.config();

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // process.env.POSTGRES_H,
      port: 5433, //Number(process.env.POSTGRES_PORT),
      username: 'postgres', //process.env.POSTGRES_U,
      password: '1234', //process.env.POSTGRES_PAS,
      database: 'HomeWorks', // process.env.POSTGRES_DB,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRoot(process.env.MONGO_URL || ''),
    MongooseModule.forFeature([
      {
        name: Blogs.name,
        schema: BlogSchema,
      },
    ]),
    MongooseModule.forFeature([{ name: Posts.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
    DeviceModule,
  ],
  controllers: [
    AppController,
    UsersController,
    BlogsController,
    PostsController,
    CommentController,
    TestingController,
    UsersController,
    AuthController,
    DeviceController,
  ],
  providers: [
    AppService,
    BlogService,
    BlogsRepository,
    BlogQueryRepo,
    PostsRepository,
    PostService,
    PostsQueryRepository,
    CommentService,
    CommentRepository,
    UserService,
    UserRepository,
    UsersQueryRepository,
    TestingRepository,
    TestingService,
    AuthRepository,
    AuthService,
    EmailService,
    AuthGuard,
    JwtService,
    AuthorizationGuard,
    UserSoftGuard,
    UserLoginExistsValidator,
    UserEmailExistsValidator,
    BlogIdExistsValidator,
    DeviceService,
    DeviceRepository,
    UpdatePostLikeStatusUseCase,
  ],
  exports: [EmailService, CommentRepository],
})
export class AppModule {}
export class CommentModule {}
export class EmailModule {}

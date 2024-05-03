import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../models/usersSchemas';
import { BlogDocument, Blogs } from '../models/blogSchems';
import { Auth, AuthDocument } from '../models/authSchemas';
import { CommentDocument } from '../models/commentSchemas';
import { Posts, PostDocument } from '../models/postSchema';

@Injectable()
export class TestingRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Blogs.name) private readonly blogModel: Model<BlogDocument>,
    @InjectModel(Posts.name) private readonly postModel: Model<PostDocument>,
    @InjectModel('Comment')
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

  // private readonly blogService: BlogService,
  // private readonly postService: PostService,
  // private readonly commentService: CommentService, // Добавьте сервис для комментариев
  // private readonly userService: UserService,

  // @Delete('/all-data')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deleteAllData(): Promise<void> {
  //   await Promise.all([
  //     this.blogService.deleteAll(),
  //     this.postService.deleteAll(),
  //     this.commentService.deleteAll(), // Вызывайте метод удаления для комментариев
  //     this.userService.deleteAll(),
  //   ]);
  // }
  async wipeAllData(): Promise<boolean> {
    try {
      await this.userModel.deleteMany({});
      await this.blogModel.deleteMany({});
      await this.postModel.deleteMany({});
      await this.commentModel.deleteMany({});
      await this.authModel.deleteMany({});
      return true;
    } catch (e) {
      return false;
    }
  }
}

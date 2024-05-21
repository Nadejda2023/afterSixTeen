import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../models/usersSchemas';
import { BlogDocument, Blogs } from '../models/blogSchems';
import { Auth, AuthDocument } from '../models/authSchemas';
import { CommentDocument } from '../models/commentSchemas';
import { Posts, PostDocument } from '../models/postSchema';
import { DataSource } from 'typeorm';

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
    private readonly dataSource: DataSource,
  ) {}

  async wipeAllData(): Promise<boolean> {
    try {
      await this.dataSource.query('DELETE FROM public."Auth"');
      await this.dataSource.query('DELETE FROM public."EmailConfirmation"');
      await this.dataSource.query('DELETE FROM public."Users"');

      await this.dataSource.query('DELETE FROM public."Device"');
      // await this.blogModel.deleteMany({});
      // await this.postModel.deleteMany({});
      // await this.commentModel.deleteMany({});

      return true;
    } catch (e) {
      return false;
    }
  }
}

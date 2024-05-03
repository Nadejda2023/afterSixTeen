import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDocument, Blogs, BlogsViewModel } from '../../models/blogSchems';
import { BlogsRepository } from './blogs.repository';
import { BlogQueryRepo } from './blogs.query-repository';
import { randomUUID } from 'crypto';
import { UsersModel } from '../../models/usersSchemas';
import {
  LikeStatus,
  PostDocument,
  PostViewModel2,
  Posts,
} from '../../models/postSchema';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blogs.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    protected blogsRepository: BlogsRepository,
    protected blogQueryRepo: BlogQueryRepo,
  ) {}

  async findAllBlogs(title: string | null | undefined): Promise<Blogs[]> {
    const filter = {};
    if (title) {
      filter['title'] = { $regex: title, $options: 'i' };
    }
    return this.blogModel.find(filter).lean();
  }

  async findBlogById(id: string): Promise<BlogsViewModel | null> {
    return this.blogsRepository.findBlogById(id);
  }

  async createBlog(name: string, description: string, website: string) {
    const newBlog: Blogs = {
      id: randomUUID(),
      name: name,
      description: description,
      websiteUrl: website,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };

    const createdBlog: Blogs = await this.blogsRepository.createBlog(newBlog);
    const resultBlog: BlogsViewModel = {
      id: createdBlog.id,
      name: createdBlog.name,
      description: createdBlog.description,
      websiteUrl: createdBlog.websiteUrl,
      createdAt: createdBlog.createdAt,
      isMembership: createdBlog.isMembership,
    };
    return resultBlog;
  }

  async updateBlog(
    id: string,
    name: string,
    description: string,
    website: string,
  ): Promise<boolean | undefined> {
    const blog = await this.blogsRepository.findBlogById(id);
    if (!blog) throw new NotFoundException();
    return await this.blogsRepository.updateBlog(
      id,
      name,
      description,
      website,
    );
  }
  async createPostForBlog(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    user: UsersModel | null,
  ): Promise<PostViewModel2 | null> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) return null;
    const createPostForBlog: PostViewModel2 = {
      id: randomUUID(),
      title: title,
      shortDescription: shortDescription,
      content: content,
      blogId: blog.id,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: user
          ? [
              {
                addedAt: new Date().toISOString(),
                userId: user.id,
                login: user.login,
              },
            ]
          : [],
      },
    };

    await this.postModel.create(createPostForBlog);
    return createPostForBlog;
  }

  async deleteBlog(_id: string) {
    return await this.blogsRepository.deleteBlog(_id);
  }

  async deleteAll(): Promise<boolean> {
    return await this.blogsRepository.deleteAll();
  }
}

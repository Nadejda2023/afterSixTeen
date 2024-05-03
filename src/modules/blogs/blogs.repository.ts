import { Injectable } from '@nestjs/common';
import { BlogDocument, Blogs, BlogsViewModel } from '../../models/blogSchems';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blogs.name) private blogModel: Model<BlogDocument>,
  ) {}

  async findAllBlogs(
    title: string | null | undefined,
  ): Promise<BlogsViewModel[]> {
    const filter: any = {};

    if (title) {
      filter.title = { $regex: title };
    }
    return this.blogModel.find(filter, { projection: { _id: 0 } }).lean();
  }

  async findBlogById(blogId: string): Promise<BlogsViewModel | null> {
    const foundBlog = await this.blogModel
      .findOne({ id: blogId })
      .select('-__v')
      .lean();
    if (!foundBlog) {
      return null;
    }

    return {
      id: foundBlog.id,
      name: foundBlog.name,
      description: foundBlog.description,
      websiteUrl: foundBlog.websiteUrl,
      createdAt: foundBlog.createdAt,
      isMembership: foundBlog.isMembership,
    };
  }

  async createBlog(newBlog: Blogs) {
    const blog = await this.blogModel.create(newBlog);
    //const newBlogId = await this.blogModel.findOne({ _id: new});
    return blog;
  }

  async updateBlog(
    id: string,
    name: string,
    description: string,
    website: string,
  ): Promise<boolean | undefined> {
    const result = await this.blogModel.updateOne(
      { id },
      { $set: { name, description, website } },
    );
    return result.matchedCount === 1;
  }

  async deleteBlog(id: string) {
    const result = this.blogModel.deleteOne({ id });

    return (await result).deletedCount === 1;
  }

  async deleteAll(): Promise<boolean> {
    try {
      const result = await this.blogModel.deleteMany({});

      return result.acknowledged;
    } catch (e) {
      return false;
    }
  }
}

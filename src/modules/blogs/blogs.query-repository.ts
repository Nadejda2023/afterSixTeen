import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlogDocument,
  Blogs,
  BlogsViewModel,
  PaginatedBlog,
} from '../../models/blogSchems';
import { Model } from 'mongoose';
import { WithId } from 'mongodb';
import {
  LikeStatus,
  PaginatedPost,
  PostDocument,
  PostViewModel2,
  Posts,
  PostsDBModels,
} from '../../models/postSchema';
import { UsersModel } from '../../models/usersSchemas';
import { BlogsRepository } from './blogs.repository';
import { randomUUID } from 'crypto';
import { TPagination } from '../../hellpers/pagination';

@Injectable()
export class BlogQueryRepo {
  constructor(
    @InjectModel(Blogs.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    private blogsRepository: BlogsRepository,
  ) {}

  async findBlogs(
    pagination: TPagination,
  ): Promise<PaginatedBlog<BlogsViewModel>> {
    const filter = {
      name: { $regex: pagination.searchNameTerm, $options: 'i' },
    };

    const result: WithId<WithId<BlogsViewModel>>[] = await this.blogModel
      .find(filter)
      .select('-_id -__v')
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount = await this.blogModel.countDocuments(filter);
    const pageCount = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
    };
  }

  async findPostForBlog(
    blogId: string,
    pagination: TPagination,
    user: UsersModel | null,
  ): Promise<PaginatedPost<PostViewModel2>> {
    const result: WithId<WithId<PostsDBModels>>[] = await this.postModel
      .find(
        { blogId },
        {
          projection: {
            _id: 0,
            __v: 0,
            'extendedLikesInfo._id': 0,
            'extendedLikesInfo.statuses._id': 0,
            'extendedLikesInfo.newestLikes._id': 0,
          },
        },
      )
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount: number = await this.postModel.countDocuments({ blogId });
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: PaginatedPost<PostViewModel2> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((item) => PostsDBModels.getViewModel(user, item)),
    };
    return response;
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

  async findAllPosts(
    pagination: TPagination,
    user: UsersModel | null,
  ): Promise<PaginatedPost<PostViewModel2>> {
    const result: WithId<WithId<PostsDBModels>>[] = await this.postModel
      .find(
        {},
        {
          projection: {
            _id: 0, // Исключаем _id
            __v: 0,
            'extendedLikesInfo._id': 0,
            'extendedLikesInfo.statuses._id': 0,
            'extendedLikesInfo.newestLikes._id': 0,
            'extendedLikesInfo.newestLikes.myStatus._id': 0,
          },
        },
      ) //PostsDBModels.getViewModel(user, foundPost){_id: 0}}) // по аналогии везде поставить на посты
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .select('-newestLikes._id -__v')
      .lean();

    // const resultWithIds = result.map((item) => {
    //   const { _id, ...rest } = item;
    //   return { ...rest, id: _id.toString() };
    // });
    const totalCount: number = await this.postModel.countDocuments({});
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: PaginatedPost<PostViewModel2> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((item) => PostsDBModels.getViewModel(user, item)),
    };
    return response;
  }
}

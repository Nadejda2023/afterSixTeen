import { Injectable } from '@nestjs/common';
import {
  PaginatedPost,
  PostDocument,
  PostViewModel2,
  Posts,
} from '../../models/postSchema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../../models/commentSchemas';
import {
  CommentDB,
  CommentDocument,
  PaginatedCommentViewModel,
} from '../../models/commentSchemas';
import { WithId } from 'mongodb';
import { TPagination } from '../../hellpers/pagination';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async findPosts(
    pagination: TPagination,
  ): Promise<PaginatedPost<PostViewModel2>> {
    const filter = {
      name: { $regex: pagination.searchNameTerm, $options: 'i' },
    };
    const result: WithId<WithId<PostViewModel2>>[] = await this.postModel
      .find(filter, { projection: { _id: 0 } })
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();
    const totalCount = await this.postModel.countDocuments(filter);
    const pageCount = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
    };
  }

  async getAllCommentsForPost(
    pagination: TPagination,
  ): Promise<PaginatedCommentViewModel<CommentDB>> {
    const filter = {
      name: { $regex: pagination.searchNameTerm, $options: 'i' },
    };
    const result: WithId<WithId<CommentDB>>[] = await this.commentModel
      .find(filter, { projection: { _id: 0 } })

      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();
    const totalCount: number = await this.commentModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
    };
  }
}

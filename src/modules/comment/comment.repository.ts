import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { WithId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { TPagination } from '../../hellpers/pagination';
import { CommentDocument, CommentDB } from '../../models/commentSchemas';
import { UsersModel } from '../../models/usersSchemas';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel('Comment')
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  async getAllCommentsForPost(
    postId: string,
    pagination: TPagination,
    user: UsersModel | null,
  ) {
    const result: WithId<CommentDB>[] = await this.commentModel
      .find({ postId }) // filter  postId: 0
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    console.log('totalResult', result);

    const totalCount: number = await this.commentModel.countDocuments({
      postId: postId,
    });
    console.log('totalCount:', totalCount);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((item) => CommentDB.getViewModel(user, item)),
    };

    return response;
  }

  async findCommentById(commentId: string): Promise<CommentDB> {
    const comment: CommentDB | null = await this.commentModel.findOne({
      id: commentId,
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    return comment;
  }
  async findCommentByForPutOrDelete(
    commentId: string,
    user,
  ): Promise<CommentDB> {
    const comment: CommentDB | null = await this.commentModel.findOne({
      id: commentId,
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    const commentUserId = comment.commentatorInfo.userId;
    if (commentUserId !== user.id) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return comment;
  }

  async deleteAll(): Promise<boolean> {
    try {
      const result = await this.commentModel.deleteMany({});

      return result.acknowledged;
    } catch (e) {
      return false;
    }
  }

  async updateCommentLikeStatus(
    existingComment: CommentDB,
  ): Promise<CommentDB | undefined | boolean> {
    const result = await this.commentModel.updateOne(
      { id: existingComment.id },
      {
        $set: {
          'likesInfo.likesCount': existingComment.likesInfo.likesCount,
          'likesInfo.dislikesCount': existingComment.likesInfo.dislikesCount,
          'likesInfo.statuses': existingComment.likesInfo.statuses,
        },
      },
    );

    console.log('result updateComment:', result);

    if (!result) {
      throw new NotFoundException(`Post with ID not found`);
    }

    return result ? true : false;
  }

  async updateComment(
    commentId: string,
    content: string,
  ): Promise<boolean | undefined> {
    const foundComment = await this.commentModel.findOne(
      { id: commentId },
      { projection: { _id: 0, postId: 0 } },
    );
    if (!foundComment) {
      throw new NotFoundException();
    }
    console.log(foundComment);

    const result = await this.commentModel.updateOne(
      { id: commentId },
      { $set: { content: content } },
      { new: true },
    );
    console.log(result);

    if (!result) {
      throw new NotFoundException(`Post with ID not found`);
    }
    return true;
  }
  async deleteComment(commentId: string) {
    const result = await this.commentModel.deleteOne({ id: commentId });
    return result.deletedCount === 1;
  }
}

import { Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDB } from '../../models/commentSchemas';
import { CommentDocument } from '../../models/commentSchemas';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}
  async deleteAll(): Promise<boolean> {
    return await this.commentRepository.deleteAll();
  }
  async updateCommentLikeStatus(
    existingComment: CommentDB,
  ): Promise<CommentDB | undefined | boolean> {
    return await this.commentRepository.updateCommentLikeStatus(
      existingComment,
    );
  }

  async updateComment(
    commentId: string,
    content: string,
  ): Promise<boolean | undefined> {
    return await this.commentRepository.updateComment(commentId, content);
  }

  async deleteComment(commentId: string) {
    const result = await this.commentRepository.deleteComment(commentId);
    if (result) {
      return true;
    }
  }
}

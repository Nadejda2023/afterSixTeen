import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus, LikeStatusType } from './postSchema';
import mongoose, { HydratedDocument } from 'mongoose';
import { UsersModel } from './usersSchemas';

export const LikeStatusCommentSchema = new mongoose.Schema<LikeStatusType>({
  myStatus: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: String, required: true },
});

@Schema()
export class LikesInfo {
  @Prop({ type: Number })
  likesCount: number;

  @Prop({ type: Number })
  dislikesCount: number;

  @Prop({ type: String })
  myStatus: string;

  @Prop({ type: [LikeStatusCommentSchema] })
  statuses: LikeStatusType[];
}

@Schema()
export class Comment {
  //   @Prop({ required: true })
  //   id: string;
  @Prop({ required: true, unique: true, type: String })
  id: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, type: Object })
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  postId: string;

  @Prop({
    likesCount: Number,
    dislikesCount: Number,
    statuses: [LikeStatusCommentSchema],
  })
  @Prop({ type: LikesInfo })
  likesInfo: LikesInfo;
}

export type CommentDocument = HydratedDocument<Comment>;
export const CommentSchema = SchemaFactory.createForClass(Comment);

export type commentViewModel = {
  //id: string;
  content: string;
  postId: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
};

export interface commentViewType {
  id: string;
  content: string;
  postId: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };
}

export class CommentDB {
  constructor(
    public id: string,
    public content: string,
    public postId: string,
    public commentatorInfo: {
      userId: string;
      userLogin: string;
    },
    public createdAt: string,
    public likesInfo: {
      statuses: LikeStatusType[];
      likesCount: number;
      dislikesCount: number;
      myStatus: string;
    },
  ) {}
  static getViewModel(user: UsersModel | null, comment: CommentDB) {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: user
          ? comment.likesInfo.statuses.find(
              (s: LikeStatusType) => s.userId === user!.id,
            )?.myStatus || LikeStatus.None
          : LikeStatus.None,
      },
    };
  }
  getViewModel2(user: UsersModel | null) {
    return {
      id: this.id,
      content: this.content,
      commentatorInfo: {
        userId: this.commentatorInfo.userId,
        userLogin: this.commentatorInfo.userLogin,
      },
      createdAt: this.createdAt,
      likesInfo: {
        likesCount: this.likesInfo.likesCount,
        dislikesCount: this.likesInfo.dislikesCount,
        myStatus: user
          ? this.likesInfo.statuses.find(
              (s: LikeStatusType) => s.userId === user!.id,
            )?.myStatus || LikeStatus.None
          : LikeStatus.None,
      },
    };
  }
}

export type PaginatedCommentViewModel<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

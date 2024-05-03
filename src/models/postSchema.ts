import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UsersModel } from './usersSchemas';

export interface PostViewModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: NewestLikeTypePost[];
  };
}

export enum LikeStatus {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export type LikeStatusType = {
  myStatus: LikeStatus;
  userId: string;
  createdAt: string;
};

export const LikeStatusPostSchema = new mongoose.Schema<LikeStatusTypePost>({
  myStatus: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: String, required: true },
});
const NewestLikesForPostsSchema = new mongoose.Schema<NewestLikeTypePost>({
  addedAt: { type: String, required: true },
  userId: { type: String, required: true },
  login: { type: String, required: true },
});
export type LikeStatusTypePost = {
  myStatus: LikeStatus;
  userId: string;
  createdAt: string;
};
export type PostDocument = HydratedDocument<Posts>;
@Schema()
export class ExtendedLikesInfo {
  @Prop({ type: Number })
  likesCount: number;

  @Prop({ type: Number })
  dislikesCount: number;

  @Prop({ type: String })
  myStatus: string;

  @Prop({ type: [LikeStatusPostSchema] })
  statuses: LikeStatusTypePost[];

  @Prop({ type: [NewestLikesForPostsSchema] })
  newestLikes: NewestLikeTypePost[];
}
@Schema()
export class Posts {
  // @Prop({ required: true })
  //_id?: Types.ObjectId;
  @Prop({ required: true, unique: true, type: String })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, type: String, ref: 'Blog' })
  blogId: string;

  @Prop({ required: true })
  blogName: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({
    likesCount: Number,
    dislikesCount: Number,
    statuses: [LikeStatusPostSchema],
    newestLikes: [NewestLikesForPostsSchema],
  })
  @Prop({ type: ExtendedLikesInfo })
  extendedLikesInfo: ExtendedLikesInfo;
}

export const PostSchema = SchemaFactory.createForClass(Posts);

export type NewestLikeTypePost = {
  addedAt?: string;
  userId?: string;
  login?: string;
};

export class PostsDBModels {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: string,
    public extendedLikesInfo: {
      likesCount: number;
      dislikesCount: number;
      myStatus: string;
      statuses: LikeStatusTypePost[];
      newestLikes: NewestLikeTypePost[];
    },
  ) {}
  static getViewModel(
    user: UsersModel | null,
    post: PostsDBModels,
  ): WithId<PostViewModel2> {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: user
          ? post.extendedLikesInfo.statuses.find(
              (s: LikeStatusType) => s.userId === user!.id,
            )?.myStatus || LikeStatus.None
          : LikeStatus.None,
        newestLikes: post.extendedLikesInfo.newestLikes
          ? post.extendedLikesInfo.newestLikes.map((l) => ({
              addedAt: l.addedAt,
              login: l.login,
              userId: l.userId,
            }))
          : [],
      },
    };
  }
}
export type PostViewModel2 = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: NewestLikeTypePost[];
  };
};

export type WithId<T> = {
  id: string;
} & T;

export type PaginatedPost<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

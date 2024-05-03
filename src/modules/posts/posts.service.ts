import { UserDocument, User, UsersModel } from './../../models/usersSchemas';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import {
  LikeStatus,
  NewestLikeTypePost,
  PostDocument,
  PostViewModel2,
  Posts,
  PostsDBModels,
} from '../../models/postSchema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostsQueryRepository } from './posts.query-repository';
import { randomUUID } from 'crypto';
import { Comment, CommentDocument } from '../../models/commentSchemas';
import { CreateAndUpdatePostDto } from './dto/create.posts.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    protected postsRepository: PostsRepository,
    protected blogsRepository: BlogsRepository,
    protected postsQueryRepository: PostsQueryRepository,
    @InjectModel(User.name) private usersModel: Model<UserDocument>,
  ) {}

  async findAllPosts(): Promise<PostViewModel2[]> {
    return this.postsRepository.findAllPosts();
  }

  async findPostById(
    id: string,
    user: UsersModel | null,
  ): Promise<PostsDBModels> {
    const post = await this.postsRepository.findPostById(id, user);
    if (!post) {
      throw new NotFoundException();
    }
    return post;
  }

  async createPost(
    createPostDto: CreateAndUpdatePostDto,
    user: UsersModel | null,
  ): Promise<PostViewModel2 | null> {
    const blog = await this.blogsRepository.findBlogById(createPostDto.blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const newPost: PostViewModel2 = {
      id: randomUUID(),
      title: createPostDto.title,
      shortDescription: createPostDto.shortDescription,
      content: createPostDto.content,
      blogId: createPostDto.blogId,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    };

    if (user) {
      // Добавляем информацию о новом лайке в массив newestLikes
      newPost.extendedLikesInfo.newestLikes.push({
        addedAt: new Date().toISOString(),
        userId: user.id,
        login: user.login,
      });

      // Увеличиваем счетчик лайков
      newPost.extendedLikesInfo.likesCount++;
    }

    const createdPost = await this.postsRepository.createPost(newPost, user);
    return createdPost;
  }

  async updatePost(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean | undefined> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    const result = await this.postModel.findOneAndUpdate(
      { id: id },
      {
        $set: {
          title: title,
          shortDescription: shortDescription,
          content: content,
          blogId: blogId,
        },
      },
      { new: true },
    );
    if (!result) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return result ? true : false;
  }
  async createPostComment(
    postId: string,
    content: string,
    commentatorInfo: { userId: string; userLogin: string },
    user: UsersModel | null,
  ) {
    const post = await this.postsRepository.findPostById(postId, user);
    if (!post) return null;
    const createCommentForPost = {
      id: randomUUID(),
      content,
      commentatorInfo,
      createdAt: new Date().toISOString(),
      postId,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
      },
    };
    const comment = await this.commentModel.create(createCommentForPost);
    console.log('comment:', comment);
    return {
      id: createCommentForPost.id,
      content: createCommentForPost.content,
      commentatorInfo: createCommentForPost.commentatorInfo,
      createdAt: createCommentForPost.createdAt,
      likesInfo: {
        likesCount: createCommentForPost.likesInfo.likesCount,
        dislikesCount: createCommentForPost.likesInfo.dislikesCount,
        myStatus: createCommentForPost.likesInfo.myStatus,
      },
    };
  }

  async updatePostLikeStatus(
    existingPost: PostsDBModels,
    latestLikes: NewestLikeTypePost[],
  ) {
    try {
      const result = await this.postModel.updateOne(
        { id: existingPost.id },
        {
          $set: {
            'extendedLikesInfo.likesCount':
              existingPost.extendedLikesInfo.likesCount,
            'extendedLikesInfo.dislikesCount':
              existingPost.extendedLikesInfo.dislikesCount,
            'extendedLikesInfo.statuses':
              existingPost.extendedLikesInfo.statuses,
            'extendedLikesInfo.newestLikes': latestLikes,
          },
        },
      );
      if (result === undefined) {
        return undefined;
      }
      return result.modifiedCount === 1;
    } catch (error) {
      console.error('Error updating post:', error);

      return undefined;
    }
  }
  async deletePost(id: string): Promise<boolean> {
    const foundPost = await this.postsRepository.deletePost(id);
    if (!foundPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return foundPost;
  }

  async deleteAll(): Promise<boolean> {
    return await this.postsRepository.deleteAll();
  }
}

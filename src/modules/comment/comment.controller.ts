import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { CommentDB } from '../../models/commentSchemas';
import { UserSoftGuard } from '../../guards/user.middleware';
import { AuthGuard } from '../../guards/auth.middleware';
import { LikeStatusDto } from './dto/postslike_status_reaction_status.dto';
import { LikeStatus, LikeStatusType } from '../../models/postSchema';
import { CreateAndUpdateCommentDto } from './dto/create.comment.dto';
import { UserDecorator } from '../../infastructure/decorators/param/user.decorator';
import { User } from '../../models/usersSchemas';

@Controller('comments')
export class CommentController {
  constructor(
    protected commentService: CommentService,
    protected commentRepository: CommentRepository,
  ) {}

  @UseGuards(UserSoftGuard)
  @Get('/:id')
  @HttpCode(200)
  async getCommentById(@Param('id') commentId: string, @Req() req) {
    const user = req.user;
    const foundComment: CommentDB =
      await this.commentRepository.findCommentById(commentId);
    const viewModel = CommentDB.getViewModel(user, foundComment);
    return viewModel;
  }

  @UseGuards(AuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(204)
  async commentUpdateLikeStatus(
    @Param('commentId') commentId: string,
    @Body() likeStatusDto: LikeStatusDto,
    @UserDecorator() user: User,
  ) {
    const existingComment =
      await this.commentRepository.findCommentById(commentId);
    console.log('existingComment:', existingComment);

    const isReactionExist = existingComment.likesInfo.statuses.find(
      (s: LikeStatusType) => s.userId === user!.id,
    );

    if (isReactionExist) {
      if (
        likeStatusDto.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingComment.likesInfo.likesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingComment.likesInfo.likesCount += 1;
        existingComment.likesInfo.dislikesCount -= 1;
      } else if (
        likeStatusDto.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingComment.likesInfo.dislikesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingComment.likesInfo.likesCount -= 1;
        existingComment.likesInfo.dislikesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingComment.likesInfo.dislikesCount -= 1;
      } else if (
        likeStatusDto.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingComment.likesInfo.likesCount -= 1;
      }
    } else {
      if (likeStatusDto.likeStatus === 'Like') {
        existingComment.likesInfo.likesCount += 1;
        existingComment.likesInfo.statuses.push({
          myStatus: LikeStatus.Like,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStatusDto.likeStatus === 'Dislike') {
        existingComment.likesInfo.dislikesCount += 1;
        existingComment.likesInfo.statuses.push({
          myStatus: LikeStatus.Dislike,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStatusDto.likeStatus === 'None') {
        existingComment.likesInfo.statuses.push({
          myStatus: LikeStatus.None,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await this.commentService.updateCommentLikeStatus(existingComment);
  }

  @UseGuards(AuthGuard)
  @Put('/:commentId')
  @HttpCode(204)
  async updateCommentById(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: CreateAndUpdateCommentDto,
    @Req() req,
    //@UserDecorator() user: User,
  ) {
    const user = req.user!;

    console.log('1', commentId);
    const existingComment =
      await this.commentRepository.findCommentByForPutOrDelete(commentId, user);
    console.log('existingComment:', existingComment);
    console.log(updateCommentDto.content);
    return await this.commentService.updateComment(
      commentId,
      updateCommentDto.content,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('/:commentId')
  @HttpCode(204)
  async deleteCommentById(
    @Param('commentId') commentId: string,
    @Req() req,
    // @Res() res,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = req.user!;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const comment = await this.commentRepository.findCommentByForPutOrDelete(
      commentId,
      user,
    );

    // if (comment) {
    //   const commentUserId = comment.commentatorInfo.userId;
    //   if (commentUserId !== user.id) {
    //     return res.sendStatus(403);
    //   }
    await this.commentService.deleteComment(req.params.commentId);
  }
}
//}

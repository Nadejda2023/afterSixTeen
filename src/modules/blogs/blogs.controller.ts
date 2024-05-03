import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogQueryRepo } from './blogs.query-repository';
import { BlogsViewModel, PaginatedBlog } from '../../models/blogSchems';

import { PaginatedPost, PostViewModel2 } from '../../models/postSchema';
import { BlogsRepository } from './blogs.repository';

import { CreateBlogDto } from './dto/createBlog.dto';
import { BlogPostDto } from './dto/createBlogForPosts.dto';

import { UpdateBlogDto } from './dto/update-blog-by-id.dto';
import {
  getPaginationFromQuery,
  getSearchNameTermFromQuery,
} from '../../hellpers/pagination';
import { AuthorizationGuard } from '../../guards/auth.basic.guard';
import { User } from '../../models/usersSchemas';
import { UserDecorator } from '../../infastructure/decorators/param/user.decorator';
import { UserSoftGuard } from '../../guards/user.middleware';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogService,
    private blogQueryRepo: BlogQueryRepo,
    protected blogsRepository: BlogsRepository,
  ) {}

  @Get()
  async getBlogs(@Query() query: any): Promise<PaginatedBlog<BlogsViewModel>> {
    const pagination = getPaginationFromQuery(query);
    const name = getSearchNameTermFromQuery(query.searchNameTerm);
    return this.blogQueryRepo.findBlogs({ ...pagination, ...name });
  }
  @UseGuards(AuthorizationGuard)
  @Post()
  async createBlog(@Body() createBlogDto: CreateBlogDto) {
    const newBlog = await this.blogsService.createBlog(
      createBlogDto.name,
      createBlogDto.description,
      createBlogDto.websiteUrl,
    );
    return newBlog;
  }
  @UseGuards(UserSoftGuard)
  @Get(':blogId/posts')
  async getPostsByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: any,
    @Req() req,
  ): Promise<PaginatedPost<PostViewModel2>> {
    const user = req.user!;
    const blogPost: BlogsViewModel | null =
      await this.blogsRepository.findBlogById(req.params.blogId);
    if (!blogPost) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }
    const pagination = getPaginationFromQuery(query);

    return await this.blogQueryRepo.findPostForBlog(blogId, pagination, user);
  }

  @UseGuards(AuthorizationGuard)
  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @UserDecorator() user: User,
    @Body() blogPostDto: BlogPostDto,
    @Req() req,
  ) {
    try {
      const blogWithId: BlogsViewModel | null =
        await this.blogsRepository.findBlogById(req.params.blogId);
      if (!blogWithId) {
        throw new NotFoundException();
      }

      const user = req.user;

      const blogsCreatePost = await this.blogsService.createPostForBlog(
        blogPostDto.title,
        blogPostDto.shortDescription,
        blogPostDto.content,
        blogId,
        user,
      );

      if (blogsCreatePost) {
        return blogsCreatePost;
      }
    } catch (error) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogsViewModel | null> {
    const foundBlog = await this.blogsService.findBlogById(id);
    if (!foundBlog) {
      throw new NotFoundException('Blog not found');
    } else {
      const blog: BlogsViewModel = {
        id: foundBlog.id,
        name: foundBlog.name,
        description: foundBlog.description,
        websiteUrl: foundBlog.websiteUrl,
        createdAt: foundBlog.createdAt,
        isMembership: foundBlog.isMembership,
      };

      return blog;
    }
  }
  @UseGuards(AuthorizationGuard)
  @Put(':id')
  @HttpCode(204)
  async updateBlog(
    @Param('id') blogId: string,
    @UserDecorator() user: User,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    const updatedBlog = await this.blogsService.updateBlog(
      blogId,
      updateBlogDto.name,
      updateBlogDto.description,
      updateBlogDto.websiteUrl,
    );

    if (!updatedBlog) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }
  }
  @UseGuards(AuthorizationGuard)
  @Delete(':id')
  async deleteBlogById(@Param('id') id: string, @Res() res) {
    const foundBlog = await this.blogsService.deleteBlog(id);
    if (!foundBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    } else {
      return res.sendStatus(HttpStatus.NO_CONTENT);
    }
  }
}

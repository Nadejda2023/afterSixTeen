import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BlogService } from './modules/blogs/blogs.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly blogsService: BlogService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

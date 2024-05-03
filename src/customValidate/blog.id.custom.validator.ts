import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../modules/blogs/blogs.repository';

@ValidatorConstraint({ name: 'BlogIdExists', async: true })
@Injectable()
export class BlogIdExistsValidator implements ValidatorConstraintInterface {
  constructor(private readonly blogRepository: BlogsRepository) {}
  async validate(blogId: string) {
    try {
      console.log('blogId:', blogId);
      const blog = await this.blogRepository.findBlogById(blogId);
      if (!blog) {
        return false;
      } else {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
}

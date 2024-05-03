import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import supertest from 'supertest';
describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/posts/:id (GET) should return a post with the specified id', async () => {
    const postId = 'a6c1d8c4-0c10-4a5e-a081-baf380881455';
    const response = await supertest(app.getHttpServer()).get(
      `/posts/${postId}`,
    );

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('id', postId);
  });

  it('/posts/:id (GET) should return 404 Not Found if the post does not exist', async () => {
    const nonExistentPostId = 'non-existent-id';
    const response = await supertest(app.getHttpServer()).get(
      `/posts/${nonExistentPostId}`,
    );
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  describe('testing of creation posts with likestatus', () => {
    let adminCredentionalsInBase64: any;

    it('creation and login to user', async () => {
      adminCredentionalsInBase64 =
        Buffer.from('admin:qwerty').toString('base64');
      const createdUser = await supertest(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Basic ${adminCredentionalsInBase64}`)
        .send({
          login: 'nadya223',
          password: 'string',
          email: 'fsklever@gmail.com',
        })
        .expect(201);

      expect(createdUser.body).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        login: 'nadya223',
        email: 'fsklever@gmail.com',
      });

      const loginOfUser = await supertest(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: 'nadya223',
          password: 'string',
        })
        .expect(200);

      const accessToken = loginOfUser.body.accessToken;

      const createdBlog = await supertest(app.getHttpServer())
        .post('/blogs')
        .set('Authorization', `Basic ${adminCredentionalsInBase64}`)
        .send({
          name: 'nameBlog',
          description: 'description',
          websiteUrl: 'https://it-incubator.io/',
        })
        //expect(createdBlog.body).toEqual({})

        .expect(201);

      const createdPost = await supertest(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Basic ${adminCredentionalsInBase64}`)
        .send({
          title: 'title',
          shortDescription: 'stringDescription',
          content: 'content',
          blogId: createdBlog.body.id,
        })
        .expect(201);

      const foundedPostById = await supertest(app.getHttpServer())
        .get(`/posts/${createdPost.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(foundedPostById.body).toEqual({
        id: createdPost.body.id,
        title: 'title',
        shortDescription: 'stringDescription',
        content: 'content',
        blogId: createdBlog.body.id,
        blogName: createdBlog.body.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updatePostsLikeStatus = await supertest(app.getHttpServer())
        .put(`/posts/${createdPost.body.id}/like-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          likeStatus: 'Like',
        })
        .expect(204);

      const postByIdAfterLike = await supertest(app.getHttpServer())
        .get(`/posts/${createdPost.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      //console.log(postByIdAfterLike.body.extendedLikesInfo)

      expect(postByIdAfterLike.body).toEqual({
        id: createdPost.body.id,
        title: 'title',
        shortDescription: 'stringDescription',
        blogId: expect.any(String),
        blogName: expect.any(String),
        createdAt: expect.any(String),
        content: 'content',
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: 'Like',
          newestLikes: [
            {
              addedAt: expect.any(String),
              userId: createdUser.body.id,
              login: createdUser.body.login,
            },
          ],
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updatePostDislikeStatus = await supertest(app.getHttpServer())
        .put(`/posts/${createdPost.body.id}/like-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          likeStatus: 'Dislike',
        })
        .expect(204);

      const postByIdAfterDislike = await supertest(app.getHttpServer())
        .get(`/comments/${createdPost.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(postByIdAfterDislike.body).toEqual({
        id: createdPost.body.id,
        title: 'title',
        shortDescription: 'stringDescription',
        content: 'content',
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 1,
          myStatus: 'Dislike',
          newestLikes: [
            {
              addedAt: expect.any(String),
              userId: createdUser.body.id,
              login: createdUser.body.login,
            },
          ],
        },
      });
    });
  });
});

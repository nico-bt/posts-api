import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { rm } from 'fs/promises';
import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { UpdatePostDto } from 'src/posts/dto/update-post.dto';

describe('Posts Module', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // DELETE DB before tests
    try {
      await rm(join(__dirname, '..', 'test.sqlite'));
    } catch (error) {
      // File not exists, continue
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const createUserDto: CreateUserDto = {
    email: 'nico.test@mail.com',
    firstname: 'Nicolas',
    lastname: 'Batt',
    password: '123456',
  };

  const createPostDto: CreatePostDto = {
    title: 'Titulo post',
    content: 'Lorem impsum lalala',
  };

  let jwtTokenCreatedUser: string;

  describe('GET - /posts', () => {
    it('should return all posts', async () => {
      // Create an user
      await request(app.getHttpServer())
        .post('/users/signup')
        .send(createUserDto)
        .then((response) => {
          const { token } = response.body;
          jwtTokenCreatedUser = token;
        });

      // Create a post
      await request(app.getHttpServer())
        .post('/posts')
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .send(createPostDto);

      // GET posts
      await request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .then(({ body }) => {
          expect(body).toEqual([
            {
              id: 1,
              title: createPostDto.title,
              content: createPostDto.content,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              user: {
                id: 1,
                name: createUserDto.firstname + ' ' + createUserDto.lastname,
              },
            },
          ]);
        });
    });
  });

  describe('POST - /posts', () => {
    it('should create a new post', async () => {
      const createPostTwoDto: CreatePostDto = {
        title: 'Journey to the Center of the Earth',
        content: 'This book is about the Journey to the Center of the Earth',
      };

      await request(app.getHttpServer())
        .post('/posts')
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .send(createPostTwoDto)
        .expect(201)
        .then(({ body }) => {
          const expectedResponse = {
            id: 2,
            ...createPostTwoDto,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
              id: 1,
              name: createUserDto.firstname + ' ' + createUserDto.lastname,
            },
          };
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if no token is passed in headers authorization', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'No token', content: 'Not auth' })
        .expect(403);
    });

    it('should throw an error if props are incorrect', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .send({})
        .expect(400, {
          message: ['title must be a string', 'content must be a string'],
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('GET - /posts/:id', () => {
    it('should return a specific post by id', async () => {
      const postId = 2;

      await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: postId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if post is not found', async () => {
      await request(app.getHttpServer()).get('/posts/9999').expect(404, {
        message: 'No post with id : 9999',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('PATCH - /posts/:id', () => {
    it('should update an existing post', async () => {
      const updatePostDto: UpdatePostDto = {
        title: 'Edited title',
        content: 'Edited content',
      };

      await request(app.getHttpServer())
        .patch('/posts/2')
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .send(updatePostDto)
        .expect(200)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: expect.any(Number),
            title: updatePostDto.title,
            content: updatePostDto.content,
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if post is not found', async () => {
      await request(app.getHttpServer())
        .patch('/posts/123456')
        .send({ title: 'non-existing-post' })
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .expect(404, {
          message: 'No post with id : 123456',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('should throw an error if no token is passed in headers authorization', async () => {
      await request(app.getHttpServer())
        .patch('/posts/2')
        .send({ title: 'No token', content: 'Not auth' })
        .expect(403);
    });
  });

  describe('DELETE - /posts/:id', () => {
    it('should throw an error if no token is passed', async () => {
      await request(app.getHttpServer()).delete(`/posts/2`).expect(403);
    });

    it('should throw an error if an user tries to delete other users posts', async () => {
      let newUserToken: string;

      await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          email: 'newUser@mail.com',
          firstname: 'New',
          lastname: 'User',
          password: 'qwerty',
        })
        .then((response) => {
          const { token } = response.body;
          newUserToken = token;
        });

      await request(app.getHttpServer())
        .delete(`/posts/2`)
        .auth(newUserToken, { type: 'bearer' })
        .expect(401, {
          message: "Ey! You can't delete other people posts",
          error: 'Unauthorized',
          statusCode: 401,
        });
    });

    it('should delete a post', async () => {
      await request(app.getHttpServer()).get(`/posts/2`).expect(200);

      await request(app.getHttpServer())
        .delete(`/posts/2`)
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer()).get(`/posts/2`).expect(404);
    });
  });
});

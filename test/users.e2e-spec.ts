import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AppModule } from 'src/app.module';
import { rm } from 'fs/promises';
import { join } from 'path';
import { describe } from 'node:test';

describe('Users Module (e2e)', () => {
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

  let jwtTokenCreatedUser: string;

  describe('create POST /users/signup', () => {
    it('should create a new user successfully', async () => {
      return request(app.getHttpServer())
        .post('/users/signup')
        .send(createUserDto)
        .then((response) => {
          const { token } = response.body;
          jwtTokenCreatedUser = token;

          expect(typeof token).toBe('string');
        });
    });

    it('should throw an error if email is already registered', async () => {
      return request(app.getHttpServer())
        .post('/users/signup')
        .send(createUserDto)
        .expect(400, {
          message: 'Email already registered',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('validations pipe: should throw an error when are missing properties in body to create a new user', async () => {
      return request(app.getHttpServer())
        .post('/users/signup')
        .send({})
        .expect(400, {
          error: 'Bad Request',
          statusCode: 400,
          message: [
            'email must be an email',
            'firstname must be a string',
            'lastname must be a string',
            'password must be a string',
          ],
        });
    });
  });

  describe('signin POST users/signin', () => {
    it('should signin an existing user, returning a token', async () => {
      return request(app.getHttpServer())
        .post('/users/signin')
        .send({ email: createUserDto.email, password: createUserDto.password })
        .expect(200)
        .then((response) => {
          const { token } = response.body;

          expect(typeof token).toBe('string');
        });
    });

    it('should throw an error signing in a NOT existing user', async () => {
      return request(app.getHttpServer())
        .post('/users/signin')
        .send({ email: 'not.registered@mail.com', password: '123456' })
        .expect(400, {
          message: 'Email NOT registered',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('should throw an error signing in a wrong password', async () => {
      return request(app.getHttpServer())
        .post('/users/signin')
        .send({ email: createUserDto.email, password: 'wrong.password' })
        .expect(400, {
          message: 'Wrong password',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('userInfo GET users/me', () => {
    it('should return user info', async () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .auth(jwtTokenCreatedUser, { type: 'bearer' })
        .expect(200)
        .then((response) => {
          const { id, email, firstname, lastname } = response.body;

          expect(typeof id).toEqual('number');
          expect(email).toEqual(createUserDto.email);
          expect(firstname).toEqual(createUserDto.firstname);
          expect(lastname).toEqual(createUserDto.lastname);
        });
    });

    it('should throw an error if not token is passed', async () => {
      return request(app.getHttpServer()).get('/users/me').expect(403, {
        message: 'Forbidden resource',
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  describe('findAll GET /users', () => {
    it('should get all the users', async () => {
      // register a second user
      await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          email: 'second.user@mail.com',
          firstname: '2nd',
          lastname: 'user',
          password: 'password',
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .then((response) => {
          expect(response.body.lenght === 2);
        });
    });
  });

  describe('findOne GET /users/id', () => {
    it('should return a single user by id', async () => {
      return request(app.getHttpServer()).get('/users/1').expect(200, {
        id: 1,
        email: createUserDto.email,
        firstname: createUserDto.firstname,
        lastname: createUserDto.lastname,
      });
    });

    it('should throw a 404 Not Found error if no user is found for the id', async () => {
      return request(app.getHttpServer()).get('/users/123456').expect(404);
    });
  });
});

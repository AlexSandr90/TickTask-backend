import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { cleanupDatabase, setupDatabase } from './setup';
import { UserDto } from '../src/modules/auth/dto/create-user.dto';
import request from 'supertest';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        forbidUnknownValues: true,
        validationError: {
          target: false,
        },
      }),
    );
    await app.init();
    // await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase(moduleFixture);
    await app.close();
  });

  describe('POST /auth/register', () => {
    const validUserDto: UserDto = {
      username: 'testuser',
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      confirmPassword: 'password123',
      timezone: 'Europe/Kyiv',
      isActive: false,
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', validUserDto.username);
      expect(response.body).toHaveProperty('email', validUserDto.email);
      expect(response.body).toHaveProperty('timezone', validUserDto.timezone);
      expect(response.body).toHaveProperty('isActive', false);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should register user with UTC timezone by default', async () => {
      const userWithoutTimezone = {
        username: validUserDto.username,
        email: `test_${Date.now()}@example.com`,
        password: validUserDto.password,
        confirmPassword: validUserDto.confirmPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userWithoutTimezone);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('timezone', 'UTC');
    });

    it('should fail when passwords do not match', async () => {
      const invalidUserDto = {
        ...validUserDto,
        confirmPassword: 'differentpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should fail when email is invalid', async () => {
      const invalidUserDto = {
        ...validUserDto,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should fail when username is empty', async () => {
      const invalidUserDto = {
        ...validUserDto,
        username: '',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should fail when password is too short', async () => {
      const invalidUserDto = {
        ...validUserDto,
        password: '123',
        confirmPassword: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should fail when user with email already exists', async () => {
      const email = `test_${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validUserDto, email });

      expect(res.status).toBe(201);

      const dublicateUserDto = {
        ...validUserDto,
        email,
        username: 'anotherUser',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dublicateUserDto)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });

    it('should fail with invalid timezone', async () => {
      const invalidUserDto = {
        ...validUserDto,
        timezone: 'Invalid/Timezone',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUserDto)
        .expect(400);
    });

    it('should register with isActive explicitly set to true', async () => {
      const email = `test_${Date.now()}1@example.com`;
      const activeUserDto = {
        ...validUserDto,
        email,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(activeUserDto);
      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('isActive', false);
    });
  });

  describe('POST /auth/login', () => {
    let userCredentials: {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      timezone?: string;
      isActive?: boolean;
    };

    beforeEach(async () => {
      userCredentials = {
        username: 'testuser',
        email: `test_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'password123',
        confirmPassword: 'password123',
        timezone: 'Europe/Kyiv',
        isActive: false,
      };
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials)
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const { email, password } = userCredentials;
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      expect(
        cookieArray.some((cookie) => cookie.startsWith('access_token=')),
      ).toBe(true);
      expect(
        cookieArray.some((cookie) => cookie.startsWith('refresh_token=')),
      ).toBe(true);
      expect(response.body).toHaveProperty('message', 'Successfully logged in');
    });

    it('should fail with invalid email', async () => {
      const invalidCredentials = {
        password: userCredentials.password,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(400);
    });

    it('should fail with invalid password', async () => {
      const invalidCredentials = {
        ...userCredentials,
        password: 'wrongPass',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: invalidCredentials.email,
          password: invalidCredentials.password,
        })
        .expect(401);
    });

    it('should fail when user is not active', async () => {
      await request(app.getHttpServer()).post('/auth/login').send({
        username: 'inactiveUser',
        email: 'inactivate@gmail.com',
        password: 'password123',
        confirmPassword: 'password123',
        isActive: false,
      });

      const inactiveCredentials = {
        email: 'inactivate@gmail.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(inactiveCredentials)
        .expect(401);
    });

    it('should fail with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
});

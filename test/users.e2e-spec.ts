import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../src/configurations/auth.config';

const mockUser = {
  id: 'test-id',
  username: 'test-username',
  email: 'testuser@example.com',
  passwordHash: 'hashed-password',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: null,
  theme: 'light',
  notifications: true,
  refreshToken: null,
  googleId: null,
  passwordResetToken: null,
  avatarPath: null,
};

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
    await prisma.user.deleteMany();
    await prisma.user.create({ data: mockUser });
    jwtToken = jwt.sign(
      { id: mockUser.id, email: mockUser.email },
      AUTH_CONFIG.secretJWT || 'your_jwt_secret_key',
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return user profile (with token)', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('PATCH  /users/me', () => {
    it('should update user profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ ...mockUser, username: 'updated-username' })
        .expect(200);

      expect(res.body.username).toBe('updated-username');
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete user', async () => {
      const res = await request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.message).toBe('Account successfully deleted');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const user = await prisma.user.create({
        data: {
          ...mockUser,
          id: 'test-id',
          email: 'testuser@example.com',
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.email).toBe('testuser@example.com');
    });
  });
});

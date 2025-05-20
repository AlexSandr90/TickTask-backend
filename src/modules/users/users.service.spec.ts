import { UsersService } from './users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';
import { SupabaseAvatarService } from './avatar/supabase-avatar.service';

const mockUsersRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findSafeUserByEmail: jest.fn(),
  findUserByRefreshToken: jest.fn(),
  findUserByPasswordResetToken: jest.fn(),
  findByPasswordResetToken: jest.fn(),
  findByGoogleId: jest.fn(),
  findOneByIdAndAvatarPath: jest.fn(),
  createUser: jest.fn(),
  findOrCreateGoogleUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserById: jest.fn(),
  removeUser: jest.fn(),
  activateUser: jest.fn(),
  updateRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
  updatePasswordResetToken: jest.fn(),
  updateAvatarPath: jest.fn(),
  resetToDefaultAvatar: jest.fn(),
};

const mockSupabaseAvatarService = {
  deleteAvatar: jest.fn(),
  getAvatarUrl: jest.fn(),
  getDefaultAvatar: jest.fn().mockReturnValue('default-avatar-url'),
};

const mockUser: User = {
  id: 'test-id',
  username: 'test-username',
  email: 'test@test.com',
  passwordHash: 'hashed-password',
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: null,
  theme: 'light',
  notifications: true,
  refreshToken: null,
  googleId: null,
  passwordResetToken: null,
  avatarPath: null,
} as User;

describe('UsersService', () => {
  let service: UsersService;
  let repository: typeof mockUsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: SupabaseAvatarService, useValue: mockSupabaseAvatarService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<typeof mockUsersRepository>(UsersRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOneByEmail', () => {
    it('should return one user by email', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.email);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        lastLogin: mockUser.lastLogin,
        theme: mockUser.theme,
        notifications: mockUser.notifications,
        refreshToken: mockUser.refreshToken,
        avatarPath: mockUser.avatarPath,
      });

      expect(repository.findByEmail).toHaveBeenCalledWith(mockUser.email);
    });
  });

  describe('findOneById', () => {
    it('should return single user', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.findOneById('test-id');
      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('test-id');
    });
  });

  describe('createUser', () => {
    it('should create new use with hashed password', async () => {
      const dto = {
        username: 'new user',
        email: 'test-new@test.test',
        password: 'Qwerty123',
      };

      const createdUser = {
        ...mockUser,
        ...dto,
        passwordHash: 'hashed-password',
      };

      repository.createUser.mockResolvedValue(createdUser);

      const result = await service.createUser(
        dto.username,
        dto.email,
        dto.password,
      );

      expect(result).toEqual(createdUser);
      expect(repository.createUser).toHaveBeenCalledWith({
        username: dto.username,
        email: dto.email,
        passwordHash: dto.password,
      });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateDto = { username: 'updated user' };
      const updatedUser = { ...mockUser, ...updateDto };

      repository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.update('test-id', updateDto);

      expect(result).toEqual({
        id: mockUser.id,
        username: 'updated user',
        email: mockUser.email,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        lastLogin: mockUser.lastLogin,
        theme: mockUser.theme,
        notifications: mockUser.notifications,
        avatarPath: mockUser.avatarPath,
        googleId: mockUser.googleId,
        passwordResetToken: mockUser.passwordResetToken,
      });

      expect(repository.updateUser).toHaveBeenCalledWith('test-id', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete user and return success message', async () => {
      repository.removeUser.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.email);
      expect(result).toEqual({ message: 'User has been removed' });
      expect(repository.removeUser).toHaveBeenCalledWith(mockUser.email);
    });
  });
});

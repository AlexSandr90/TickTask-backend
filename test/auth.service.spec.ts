import { AuthService } from '../src/modules/auth/auth.service';
import { UsersRepository } from '../src/modules/users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { TestingModule, Test } from '@nestjs/testing';
import {
  mockJwtService,
  mockUser,
  mockUsersRepository,
  mockUserWithoutPassword,
} from './mocks/auth.mock';
import { UserDto } from '../src/modules/auth/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const validUserDto: UserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      timezone: 'Europe/Kyiv',
    };

    it('should register a new user successfully', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.isValidTimezone.mockReturnValue(true);
      usersRepository.createUser.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.register(validUserDto);

      expect(result).toEqual(mockUserWithoutPassword);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        validUserDto.email,
      );
      expect(usersRepository.createUser).toHaveBeenCalledWith({
        username: validUserDto.username,
        email: validUserDto.email,
        passwordHash: 'hashedpassword',
        timezone: validUserDto.timezone,
        isActive: false,
      });
    });

    it('should throw BadRequestException for invalid timezone', async () => {
      const invalidUserDto = { ...validUserDto, timezone: 'Invalid/Timezone' };

      usersRepository.isValidTimezone.mockReturnValue(false);

      await expect(service.register(invalidUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(validUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should set isActive to false by default', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.isValidTimezone.mockReturnValue(true);
      usersRepository.createUser.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      await service.register(validUserDto);

      expect(usersRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('validateTimezones', () => {
    it('should pass for UTC timezone', () => {
      expect(() => service['validateTimezones']('UTC')).not.toThrow();
    });

    it('should pass for valid non-UTC timezone', () => {
      usersRepository.isValidTimezone.mockResolvedValue(true);

      expect(() => service['validateTimezones']('Europe/Kyiv')).not.toThrow();
    });

    it('should throw for invalid timezone', () => {
      usersRepository.isValidTimezone.mockReturnValue(false);

      expect(() => service['validateTimezone']('Invalid/Timezone')).toThrow(
        BadRequestException,
      );
    });

    it('should pass for undefined timezone', () => {
      expect(() => service['validateTimezone'](undefined)).not.toThrow();
    });
  });

  describe('validateEmailUnique', () => {
    it('should pass when email is unique', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service['validateEmailUnique']('test@example.com'),
      ).resolves.not.toThrow();
    });

    it('should throw when email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service['validateEmailUnique']('test@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

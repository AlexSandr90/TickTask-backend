export const mockUsersRepository = {
  findByEmail: jest.fn(),
  createUser: jest.fn(),
  isValidTimezone: jest.fn(),
};

export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  timezone: 'UTC',
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: null,
  theme: 'light',
  notifications: true,
};

export const mockUserWithoutPassword = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  timezone: 'UTC',
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: null,
  theme: 'light',
  notifications: true,
};

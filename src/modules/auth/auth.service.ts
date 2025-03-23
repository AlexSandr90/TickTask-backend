import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

interface UserWithoutPassword {
  id: string;
  username: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  theme: string;
  notifications: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(
    email: string,
    password: string,
  ): Promise<any> {
    return this.usersService.createUser(email, password);
  }

  async login(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('invalid user credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    console.log('You are logged in!');
    return userWithoutPassword;
  }
}

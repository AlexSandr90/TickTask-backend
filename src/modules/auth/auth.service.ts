import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string, confirmPassword: string): Promise<UserWithoutPassword> {
    if (password !== confirmPassword) {
      throw new UnauthorizedException('Пароли не совпадают');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.createUser(username, email, hashedPassword);
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string, userId: string }> {
    console.log('📩 Получен email:', email);

    const user = await this.usersService.findByEmail(email);
    console.log('🔍 Найден пользователь:', user);

    if (!user || !user.passwordHash) {
      console.log('⛔ Пользователь не найден или пароль отсутствует');
      throw new UnauthorizedException('Неверные учетные данные');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔑 Проверка пароля:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('⛔ Неверный пароль');
      throw new UnauthorizedException('Неверные учетные данные');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(32).toString('hex');

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return { access_token: accessToken, refresh_token: refreshToken, userId: user.id };
  }


  async refreshToken(userId: string, refreshToken: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Недействительный токен');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    return { access_token: accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, '');
  }
}

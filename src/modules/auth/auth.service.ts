import { BadRequestException, Injectable, UnauthorizedException, Response, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { sendPasswordResetEmail } from '../../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,

  ) {}

  async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<UserWithoutPassword> {
    if (password !== confirmPassword) {
      throw new UnauthorizedException('Пароли не совпадают');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException(
        'Пользователь с таким email уже существует',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.createUser(
      username,
      email,
      hashedPassword,
    );
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(
    email: string,
    password: string,
    @Response() res: any,
  ): Promise<void> {  // Возвращаем void, потому что не возвращаем данные в теле
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
    console.log('🎯 Генерация токена с payload:', payload);
    const accessToken = this.jwtService.sign(payload);
    console.log('🎯 Генерация access token:', accessToken);
    const refreshToken = randomBytes(32).toString('hex');
    console.log('✅ Refresh token сгенерирован:', refreshToken);
    await this.usersService.updateRefreshToken(user.id, refreshToken);
    console.log('✅ Refresh token сохранен в базе данных');

    // Устанавливаем токены в куки
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,  // Убедитесь, что в продакшн-режиме будет true
      maxAge: 3600000, // 1 час
      path: '/',
    });
    console.log('✅ Access token отправлен в куки');

    // Ответ без тела
    return res.status(HttpStatus.OK).json({ message: 'Успешный вход' });

  }

  async refreshToken(
    userId: string,
    refreshToken: string,
    @Response() res: any
  ): Promise<{ access_token: string }> {
    console.log('🔹 Начало обновления токена');
    console.log('👉 userId:', userId);
    console.log('👉 refreshToken из запроса:', refreshToken);

    const user = await this.usersService.findById(userId);

    console.log('🔹 Найден пользователь:', user ? user.id : 'не найден');
    console.log('👉 refreshToken из базы:', user?.refreshToken);

    if (!user || user.refreshToken !== refreshToken) {
      console.error('❌ Недействительный токен или пользователь не найден');
      throw new UnauthorizedException('Недействительный токен');
    }

    console.log('✅ Токен прошёл проверку, генерируем новый access_token');
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,   // включаем для HTTPS (если в продакшене)
      maxAge: 3600000,  // время жизни куки (1 час)
      sameSite: 'None', // Это необходимо для кросс-доменных запросов
    });
    console.log('✅ Новый access_token сгенерирован:', accessToken);

    return { access_token: accessToken };
  }

  async logout(userId: string,  @Response() res: any): Promise<void> {
    await this.usersService.updateRefreshToken(userId, '');
    res.clearCookie('access_token');
  }

  async generateJwt(user: UserWithoutPassword): Promise<any> {
    const payload = { sub: user.id, email: user.email };


    return this.jwtService.sign(payload);
  }


  async googleLogin(user: any): Promise<any> {
    return this.usersService.findOrCreateGoogleUser({
      googleId: user.googleId,
      email: user.email,
      username: user.username,
    });
  }
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Пользователь с таким email не найден');
    }

    // Генерация уникального токена для сброса пароля
    const resetToken = randomBytes(32).toString('hex');
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    // Сохранение токена в базе данных
    await this.usersService.updatePasswordResetToken(user.id, resetToken);

    // Отправка email с ссылкой для сброса пароля
    await sendPasswordResetEmail(email, 'Сброс пароля', resetLink);
  }

  // Метод для сброса пароля с использованием токена
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Токен для сброса пароля неверный или истек');
    }

    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновление пароля пользователя
    await this.usersService.updatePassword(user.id, hashedPassword);

    // Очистка токена сброса
    await this.usersService.updatePasswordResetToken(user.id, '');
  }

}

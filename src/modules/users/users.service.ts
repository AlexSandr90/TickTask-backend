import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/user.dto';
import { generateJwtToken, verifyJwtToken } from '../../common/utils/jwt.util';
import * as process from 'node:process';
import { sendVerificationEmail } from '../../email/email.service';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(email: string) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    const { passwordHash, googleId, passwordResetToken, ...safeUser } = user;

    return safeUser;
  }

  async findByEmail(email: string) {
    return await this.usersRepository.findByEmail(email);
  }

  async createUser(username: string, email: string, passwordHash: string) {
    return this.usersRepository.createUser({ username, email, passwordHash });
  }

  async update(email: string, data: UpdateUserDto) {
    const { isActive, ...updateData } = data;

    const user = await this.usersRepository.updateUser(email, updateData);

    if (!user) throw new NotFoundException('Failed to update user');

    const { refreshToken, passwordHash, ...safeUser } = user;

    return safeUser;
  }

  async remove(email: string) {
    const user = await this.usersRepository.removeUser(email);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User has been removed' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.usersRepository.updateRefreshToken(userId, refreshToken);
  }

  async sendMagicLink(email: string) {
    if (!email) throw new BadRequestException('Email not sent');

    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User with this email not found');

    const token = generateJwtToken(email, user.id);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const magikLink = `${baseUrl}/activate/${token}`;

    try {
      await sendVerificationEmail(email, 'Your Magic Link', magikLink);
    } catch (error) {
      throw new InternalServerErrorException('Error sending email');
    }

    return { message: 'Verification email sent.' };
  }

  async activateUserByToken(token: string) {
    if (!token) throw new BadRequestException('Token not transferred');

    let email: string;

    try {
      const decoded = verifyJwtToken(token);
      email = decoded.email;
    } catch (e) {
      throw new BadRequestException(`Invalid or expired link. Error ${e}`);
    }

    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (user.isActive) {
      throw new BadRequestException('The User is already activated');
    }

    try {
      const updateUser = await this.usersRepository.activateUser(email);
      return { message: 'User successfully activated', user: updateUser };
    } catch (e) {
      throw new InternalServerErrorException('Failed to activate user');
    }
  }

  async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<any> {
    try {
      if (!data.googleId || !data.email || !data.username) {
        throw new BadRequestException('Missing required Google user data');
      }

      let user = await this.usersRepository.findByGoogleId(data.googleId);

      if (!user) user = await this.usersRepository.findByEmail(data.email);

      if (!user) user = await this.usersRepository.createGoogleUser(data);

      return user;
    } catch (e) {
      throw new Error('Error while finding or creating Google user');
    }
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.usersRepository.updatePassword(userId, hashedPassword);
  }

  async updatePasswordResetToken(userId: string, newPassword: string) {
    return this.usersRepository.updatePasswordResetToken(userId, newPassword);
  }

  async findByPasswordResetToken(resetToken: string) {
    const user =
      await this.usersRepository.findByPasswordResetToken(resetToken);

    if (!user) {
      throw new NotFoundException('Invalid or outdated  token');
    }

    return user;
  }

  async updateAvatarPath(userId: string, avatarPath: string) {
    try {
      return await this.usersRepository.updateAvatarPath(userId, avatarPath);
    } catch (e) {
      throw new InternalServerErrorException('Error updating avatar path');
    }
  }
}


import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import { generateJwtToken, verifyJwtToken } from '../../common/utils/jwt.util';
import { sendVerificationEmail } from '../../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    const { passwordHash, googleId, passwordResetToken, ...safeUser } = user;
    return safeUser;
  }
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(username: string, email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isActive: false,
      },
    });
  }

  async update(email: string, data: UpdateUserDto) {
    const { isActive, ...updateData } = data;

    const user = await this.prisma.user.update({
      where: { email },
      data: updateData,
    });

    if (!user) throw new NotFoundException('Failed to update user');

    const { refreshToken, passwordHash, ...safeUser } = user;

    return safeUser;
  }
  async remove(email: string) {
    const user = await this.prisma.user.delete({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User successfully deleted' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async sendMagicLink(email: string) {
    if (!email) {
      throw new BadRequestException('Email not sent');
    }

    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No user with this email address found.');
    }

    const token = generateJwtToken(email, user.id);
    const magicLinks = [
      `https://taskcraft.click/activate/${token}`,
      `http://localhost:3000/activate/${token}`,
    ];

    try {
      await sendVerificationEmail(email, 'Your Magic Link', magicLinks.join('\n'));
    } catch (error) {
      throw new InternalServerErrorException('Error sending email');
    }

    return { message: 'Verification email sent.' };
  }

  async activateUserByToken(token: string) {
    if (!token) {
      throw new BadRequestException('Token not transferred');
    }

    let email: string;

    try {
      const decoded = verifyJwtToken(token);
      email = decoded.email;
    } catch (error) {
      throw new BadRequestException(
        `Invalid or expired link. Error: ${error.message}`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('The user is already activated');
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { email },
        data: { isActive: true },
      });

      return { message: 'User successfully activated', user: updatedUser };
    } catch (error) {
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
      }

      let user = await this.prisma.user.findUnique({
        where: { googleId: data.googleId },
      });

      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: data.email },
        });
      }

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            googleId: data.googleId,
            email: data.email,
            username: data.username,
          },
        });
      } else {
      }

      return user;
    } catch (error) {
      throw new Error('Error while finding or creating Google user');
    }
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async updatePasswordResetToken(userId: string, resetToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: resetToken },
    });
  }

  async findByPasswordResetToken(resetToken: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: resetToken,
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or outdated token');
    }

    return user;
  }
}

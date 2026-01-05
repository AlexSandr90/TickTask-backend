import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor(private prisma: PrismaService) {
    // Инициализация Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async registerDevice(
    userId: string,
    token: string,
    platform: 'WEB' | 'IOS' | 'ANDROID',
    deviceId?: string,
  ) {
    // Деактивируем старые токены этого устройства
    if (deviceId) {
      await this.prisma.deviceToken.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Создаём или обновляем токен
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: {
        isActive: true,
        lastUsed: new Date(),
        platform,
        deviceId,
      },
      create: {
        userId,
        token,
        platform,
        deviceId,
      },
    });
  }

  async unregisterDevice(token: string) {
    return this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ) {
    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (devices.length === 0) return;

    const tokens = devices.map((d) => d.token);

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Удаляем невалидные токены
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        await this.prisma.deviceToken.updateMany({
          where: {
            token: { in: failedTokens },
          },
          data: {
            isActive: false,
          },
        });
      }

      return response;
    } catch (error) {
      console.error('FCM send error:', error);
      throw error;
    }
  }
}

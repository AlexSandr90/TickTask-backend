import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-google-oauth20';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class GoogleStrategy {
  constructor(private prismaService: PrismaService) {
  }

  strategyConfig() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Missing Google OAuth configuration');
    }

    return new Strategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['email', 'profile'],
      },
      this.validate.bind(this),
    );
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void,
  ) {
    try {
      const { id, emails, name } = profile;

      const user = await this.prismaService.user.upsert({
        where: { googleId: id },
        update: {},
        create: {
          googleId: id,
          email: emails[0].value,
          username: `${name.givenName} ${name.familyName}`,
          refreshToken,
        },
      });

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}

import { Strategy } from 'passport-google-oauth20';
import { PrismaService } from '../../../../prisma/prisma.service';
import { generateJwtToken } from '../../../common/utils/jwt.util';

export class GoogleStrategy {
  constructor(private prismaService: PrismaService) {}

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
    _accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ) {
    try {
      const { id, emails, name } = profile;
      const email = emails && emails[0] ? emails[0].value : null;

      if (!email) {
      }

      // Ищем пользователя по email
      let user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (user) {
        user = await this.prismaService.user.update({
          where: { email },
          data: {
            googleId: id,
            username: `${name.givenName} ${name.familyName}`,
            isActive: true,
            refreshToken,
          },
        });
      } else {
        user = await this.prismaService.user.create({
          data: {
            googleId: id,
            email,
            username: `${name.givenName} ${name.familyName}`,
            isActive: true,
            refreshToken,
          },
        });
      }

      const customRefreshToken = generateJwtToken(user.email, user.id);

      user = await this.prismaService.user.update({
        where: { email },
        data: { refreshToken: customRefreshToken },
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
import { Strategy } from 'passport-google-oauth20';
import { PrismaService } from '../../../../prisma/prisma.service';
import { generateJwtToken } from '../../../common/utils/jwt.util';

export class GoogleStrategy {
  constructor(private prismaService: PrismaService) {
  }

  strategyConfig() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      console.error('Google OAuth configuration missing');
      throw new Error('Missing Google OAuth configuration');
    }

    console.log('Google OAuth strategy configured with client ID:', clientID);

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
    done: (error: any, user?: any) => void
  ) {
    try {
      console.log('Received Google Profile:', profile);
      console.log('Access Token:', accessToken);  // Логируем accessToken
      console.log('Refresh Token:', refreshToken);  // Логируем refreshToken

      const { id, emails, name } = profile;
      const email = emails && emails[0] ? emails[0].value : null;

      if (!email) {
        console.error('Google profile does not contain an email');
        throw new Error('Google profile does not contain an email');
      }

      console.log('User email from Google profile:', email);

      // Ищем пользователя по email
      let user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (user) {
        console.log(`User found with email ${email}. Updating user data.`);
        user = await this.prismaService.user.update({
          where: { email },
          data: {
            googleId: id,
            username: `${name.givenName} ${name.familyName}`,
            isActive: true,
            refreshToken,  // Сохраняем refresh token
          },
        });
      } else {
        console.log(`User with email ${email} not found. Creating new user.`);
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

      console.log('User after find or create:', user);

      // Генерируем новый JWT для пользователя
      const customRefreshToken = generateJwtToken(user.email, user.id);
      console.log('Generated JWT for user:', customRefreshToken);

      // Обновляем пользователя с новым refreshToken
      user = await this.prismaService.user.update({
        where: { email },
        data: { refreshToken: customRefreshToken },
      });

      console.log('User after updating with new refresh token:', user);

      // Завершаем процесс с пользователем
      done(null, user); // Здесь передаем пользователя после всех операций
    } catch (error) {
      console.error('Error during Google OAuth validation:', error);
      done(error, null); // Если возникла ошибка, передаем её в done
    }
  }
}
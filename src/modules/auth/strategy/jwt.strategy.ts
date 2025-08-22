import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AUTH_CONFIG } from '../../../configurations/auth.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.access_token,
      ]),
      secretOrKey: AUTH_CONFIG.secretJWT as string,
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        pendingEmail: user.pendingEmail,
      };
    } catch (error) {
      console.error('JWT validation error ', error);
      throw error;
    }
  }
}

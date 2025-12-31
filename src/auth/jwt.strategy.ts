import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtSecret'),
    });
  }

  // sub = user ID in Supabase JWT
  // payload contains the decoded JWT payload (stored in request.user, decoded automatically by Passport)
  async validate(payload: any) {
    // Payload should contain user info from Supabase JWT
    const userId = payload.sub || payload.user_id;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch user profile
    const profile = await this.authService.getUserProfile(userId);
    if (!profile.success || !profile.data) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: userId,
      email: payload.email,
      role: profile.data.role,
    };
  }
}

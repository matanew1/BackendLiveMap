import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from './user.entity';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const result = await this.authService.getUser(token);

      if (result.success && result.data?.user) {
        // Fetch user profile for role
        const profile = await this.authService.getUserProfile(
          result.data.user.id,
        );
        request.user = {
          ...result.data.user,
          role:
            profile.success && profile.data ? profile.data.role : UserRole.USER,
        };
        return true;
      } else {
        throw new UnauthorizedException(result.message || 'Invalid token');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users.service';

interface payloadJwtType {
  id: number;
  email: string;
  iat: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext) {
    // 1) Grab JWT from request and verify it
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      return false;
    }

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET,
      ) as payloadJwtType;

      // 2) Get user from db
      const user = await this.usersService.findOneById(payload.id);
      if (!user) {
        return false;
      }

      // 3) Add user to request
      request.user = payload;
    } catch (error) {
      return false;
    }

    return true;
  }
}

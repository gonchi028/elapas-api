import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from './auth';

declare module 'express' {
  interface Request {
    user?: unknown;
    session?: unknown;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await auth.api.getSession({
      headers: request.headers as Record<string, string>,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.user = session.user;

    request.session = session.session;
    return true;
  }
}

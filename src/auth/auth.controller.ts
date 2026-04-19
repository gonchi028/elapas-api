import { All, Controller, Get, Post, Req, Res } from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import {
  SignUpDto,
  SignInDto,
  AuthTokenResponseDto,
  GetSessionResponseDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('sign-up/email')
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  signUp(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @Post('sign-in/email')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  signIn(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out (requires Origin header)' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 403, description: 'Missing Origin header' })
  signOut(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @Get('get-session')
  @ApiOperation({ summary: 'Get current session' })
  @ApiResponse({
    status: 200,
    type: GetSessionResponseDto,
    description: 'Session object or null',
  })
  getSession(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @All('*splat')
  @ApiExcludeEndpoint()
  fallback(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }
}

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

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  @Post('sign-up/email')
  @ApiOperation({ summary: 'Registrarse con correo y contraseña' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  signUp(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @Post('sign-in/email')
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  signIn(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @Post('sign-out')
  @ApiOperation({ summary: 'Cerrar sesión (requiere header Origin)' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 403, description: 'Falta header Origin' })
  signOut(@Req() req: Request, @Res() res: Response) {
    void toNodeHandler(auth)(req, res);
  }

  @Get('get-session')
  @ApiOperation({ summary: 'Obtener sesión actual' })
  @ApiResponse({
    status: 200,
    type: GetSessionResponseDto,
    description: 'Objeto de sesión o null',
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

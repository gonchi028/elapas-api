import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'Token de sesión' })
  token: string;

  @ApiProperty({ type: UserResponseDto, description: 'Datos del usuario' })
  user: UserResponseDto;
}

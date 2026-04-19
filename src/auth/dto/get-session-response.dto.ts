import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

class SessionDto {
  @ApiProperty({ description: 'Identificador único' })
  id: string;

  @ApiProperty({ description: 'Token de sesión' })
  token: string;

  @ApiProperty({ description: 'Fecha de expiración' })
  expiresAt: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: string;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: string;

  @ApiProperty({ nullable: true, description: 'Dirección IP' })
  ipAddress: string | null;

  @ApiProperty({ nullable: true, description: 'Agente de usuario' })
  userAgent: string | null;

  @ApiProperty({ description: 'ID del usuario' })
  userId: string;
}

export class GetSessionResponseDto {
  @ApiProperty({ type: SessionDto, description: 'Datos de la sesión' })
  session: SessionDto;

  @ApiProperty({ type: UserResponseDto, description: 'Datos del usuario' })
  user: UserResponseDto;
}

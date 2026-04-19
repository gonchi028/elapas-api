import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Nombre completo' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
  email?: string;

  @ApiPropertyOptional({
    enum: ['admin', 'brigadista', 'ciudadano'],
    description: 'Rol del usuario',
  })
  role?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  estado?: boolean;
}

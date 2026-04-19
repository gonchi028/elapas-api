import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto {
  @ApiPropertyOptional()
  nombre?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional({ enum: ['admin', 'brigadista', 'ciudadano'] })
  role?: string;

  @ApiPropertyOptional()
  estado?: boolean;
}

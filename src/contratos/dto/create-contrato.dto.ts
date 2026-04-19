import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContratoDto {
  @ApiProperty()
  nroContrato: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  distritoId: string;

  @ApiProperty()
  direccion: string;

  @ApiProperty()
  nroMedidor: string;

  @ApiPropertyOptional()
  latitud?: string;

  @ApiPropertyOptional()
  longitud?: string;

  @ApiPropertyOptional({ enum: ['activo', 'suspendido', 'cortado'] })
  estado?: string;
}

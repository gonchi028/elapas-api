import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContratoDto {
  @ApiProperty({ description: 'Número de contrato' })
  nroContrato: string;

  @ApiProperty({ description: 'ID del usuario' })
  usuarioId: string;

  @ApiProperty({ description: 'ID del distrito' })
  distritoId: string;

  @ApiProperty({ description: 'Dirección del inmueble' })
  direccion: string;

  @ApiProperty({ description: 'Número de medidor' })
  nroMedidor: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  longitud?: string;

  @ApiPropertyOptional({
    enum: ['activo', 'suspendido', 'cortado'],
    description: 'Estado',
  })
  estado?: string;
}

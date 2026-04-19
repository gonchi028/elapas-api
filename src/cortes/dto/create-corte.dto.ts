import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorteDto {
  @ApiProperty({ description: 'ID del contrato' })
  contratoId: string;

  @ApiProperty({ description: 'Motivo del corte' })
  motivo: string;

  @ApiPropertyOptional({ description: 'URL de la fotografía' })
  fotoUrl?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  longitud?: string;
}

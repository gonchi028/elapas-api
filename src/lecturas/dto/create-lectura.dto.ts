import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLecturaDto {
  @ApiProperty({ description: 'ID del contrato' })
  contratoId: string;

  @ApiProperty({ description: 'Valor de lectura del medidor (m³)' })
  valorLectura: number;

  @ApiPropertyOptional({ description: 'URL de la fotografía' })
  fotoUrl?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  longitud?: string;
}

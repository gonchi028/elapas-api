import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLecturaDto {
  @ApiProperty({ description: 'ID del contrato' })
  @IsString()
  @IsNotEmpty()
  contratoId: string;

  @ApiProperty({ description: 'Valor de lectura del medidor (m³)' })
  @IsInt()
  @Min(0)
  valorLectura: number;

  @ApiPropertyOptional({ description: 'URL de la fotografía' })
  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  @IsOptional()
  @IsString()
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  @IsOptional()
  @IsString()
  longitud?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePredioDto {
  @ApiProperty({ description: 'ID del distrito' })
  @IsString()
  @IsNotEmpty()
  distritoId: string;

  @ApiProperty({ description: 'Dirección del predio' })
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  @IsOptional()
  @IsString()
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  @IsOptional()
  @IsString()
  longitud?: string;
}

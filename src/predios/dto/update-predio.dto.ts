import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdatePredioDto {
  @ApiPropertyOptional({ description: 'ID del distrito' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  distritoId?: string;

  @ApiPropertyOptional({ description: 'Dirección del predio' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  @IsOptional()
  @IsString()
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  @IsOptional()
  @IsString()
  longitud?: string;
}

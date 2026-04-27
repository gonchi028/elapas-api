import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContratoDto {
  @ApiProperty({ description: 'Número de contrato' })
  @IsString()
  @IsNotEmpty()
  nroContrato: string;

  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  @ApiProperty({ description: 'ID del distrito' })
  @IsString()
  @IsNotEmpty()
  distritoId: string;

  @ApiProperty({ description: 'Dirección del inmueble' })
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @ApiProperty({ description: 'Número de medidor' })
  @IsString()
  @IsNotEmpty()
  nroMedidor: string;

  @ApiPropertyOptional({ description: 'Latitud GPS' })
  @IsOptional()
  @IsString()
  latitud?: string;

  @ApiPropertyOptional({ description: 'Longitud GPS' })
  @IsOptional()
  @IsString()
  longitud?: string;

  @ApiPropertyOptional({
    enum: ['activo', 'suspendido', 'cortado'],
    description: 'Estado',
  })
  @IsOptional()
  @IsString()
  @IsIn(['activo', 'suspendido', 'cortado'])
  estado?: string;
}

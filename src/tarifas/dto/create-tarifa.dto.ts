import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTarifaDto {
  @ApiProperty({ description: 'Nombre de la tarifa' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Límite inferior del tramo (m³)' })
  @IsInt()
  @Min(0)
  tramoMin: number;

  @ApiProperty({ description: 'Límite superior del tramo (m³)' })
  @IsInt()
  @Min(0)
  tramoMax: number;

  @ApiProperty({ description: 'Precio por metro cúbico (Bs)' })
  @IsString()
  @IsNotEmpty()
  precioM3: string;

  @ApiProperty({ description: 'Cargo fijo mensual (Bs)' })
  @IsString()
  @IsNotEmpty()
  cargoFijo: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

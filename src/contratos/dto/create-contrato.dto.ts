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

  @ApiProperty({ description: 'ID del predio' })
  @IsString()
  @IsNotEmpty()
  predioId: string;

  @ApiProperty({ description: 'ID del medidor' })
  @IsString()
  @IsNotEmpty()
  medidorId: string;

  @ApiPropertyOptional({
    enum: ['activo', 'suspendido', 'cortado'],
    description: 'Estado',
  })
  @IsOptional()
  @IsString()
  @IsIn(['activo', 'suspendido', 'cortado'])
  estado?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMedidorDto {
  @ApiPropertyOptional({ description: 'Número de medidor' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nroMedidor?: string;

  @ApiPropertyOptional({ description: 'ID del contrato asociado' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contratoId?: string;
}

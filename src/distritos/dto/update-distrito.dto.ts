import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDistritoDto {
  @ApiPropertyOptional({
    example: 'Distrito 1 - Central',
    description: 'Nombre completo',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'D1', description: 'Código del distrito' })
  @IsOptional()
  @IsString()
  codigo?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDistritoDto {
  @ApiPropertyOptional({ example: 'Distrito 1 - Central' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'D1' })
  codigo?: string;
}

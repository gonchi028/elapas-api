import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDistritoDto {
  @ApiPropertyOptional({
    example: 'Distrito 1 - Central',
    description: 'Nombre completo',
  })
  nombre?: string;

  @ApiPropertyOptional({ example: 'D1', description: 'Código del distrito' })
  codigo?: string;
}

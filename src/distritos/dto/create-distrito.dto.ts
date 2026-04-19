import { ApiProperty } from '@nestjs/swagger';

export class CreateDistritoDto {
  @ApiProperty({
    example: 'Distrito 1 - Central',
    description: 'Nombre completo',
  })
  nombre: string;

  @ApiProperty({ example: 'D1', description: 'Código del distrito' })
  codigo: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class CreateDistritoDto {
  @ApiProperty({ example: 'Distrito 1 - Central' })
  nombre: string;

  @ApiProperty({ example: 'D1' })
  codigo: string;
}

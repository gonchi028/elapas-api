import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDistritoDto {
  @ApiProperty({
    example: 'Distrito 1 - Central',
    description: 'Nombre completo',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'D1', description: 'Código del distrito' })
  @IsString()
  @IsNotEmpty()
  codigo: string;
}

import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAsignacionDto {
  @ApiProperty({
    description: 'ID del brigadista al que se asignan los contratos',
    example: 'uuid-brigadista',
  })
  @IsString()
  @IsNotEmpty()
  brigadistaId: string;

  @ApiProperty({
    description: 'Lista de IDs de contratos a asignar al brigadista',
    example: ['uuid-contrato-1', 'uuid-contrato-2'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  contratoIds: string[];
}

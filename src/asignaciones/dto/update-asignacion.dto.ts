import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAsignacionDto {
  @ApiProperty({
    description:
      'Lista completa de IDs de contratos asignados al brigadista (reemplaza todas las asignaciones existentes)',
    example: ['uuid-contrato-1', 'uuid-contrato-2', 'uuid-contrato-3'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  contratoIds: string[];
}

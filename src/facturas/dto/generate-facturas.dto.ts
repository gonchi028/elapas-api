import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class GenerateFacturasDto {
  @ApiProperty({
    example: '2026-04',
    description: 'Período de facturación (ej. 2026-04)',
  })
  @IsString()
  @IsNotEmpty()
  periodo: string;

  @ApiProperty({ example: '2026-04-30', description: 'Fecha de vencimiento' })
  @IsDateString()
  fechaVencimiento: string;
}

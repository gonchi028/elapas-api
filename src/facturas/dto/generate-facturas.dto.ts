import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class GenerateFacturasDto {
  @ApiProperty({ example: '2026-04' })
  @IsString()
  @IsNotEmpty()
  periodo: string;

  @ApiProperty({ example: '2026-04-30' })
  @IsDateString()
  fechaVencimiento: string;
}

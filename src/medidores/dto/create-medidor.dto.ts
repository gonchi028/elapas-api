import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMedidorDto {
  @ApiProperty({ description: 'Número de medidor', example: 'MED-0001' })
  @IsString()
  @IsNotEmpty()
  nroMedidor: string;

  @ApiProperty({ description: 'ID del contrato asociado' })
  @IsString()
  @IsNotEmpty()
  contratoId: string;
}

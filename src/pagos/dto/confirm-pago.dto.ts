import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MetodoPago {
  QR_SIMPLE = 'qr_simple',
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
}

export class ConfirmPagoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  facturaId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  monto: string;

  @ApiProperty({ enum: MetodoPago, required: false })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referencia?: string;
}

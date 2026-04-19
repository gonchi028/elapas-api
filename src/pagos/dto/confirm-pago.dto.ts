import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MetodoPago {
  QR_SIMPLE = 'qr_simple',
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
}

export class ConfirmPagoDto {
  @ApiProperty({ description: 'ID de la factura' })
  @IsString()
  @IsNotEmpty()
  facturaId: string;

  @ApiProperty({ description: 'Monto del pago (Bs)' })
  @IsString()
  @IsNotEmpty()
  monto: string;

  @ApiProperty({
    enum: MetodoPago,
    required: false,
    description: 'Método de pago',
  })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: string;

  @ApiProperty({ required: false, description: 'Número de referencia' })
  @IsString()
  @IsOptional()
  referencia?: string;
}

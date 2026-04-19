import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTarifaDto {
  @ApiProperty({ description: 'Nombre de la tarifa' })
  nombre: string;

  @ApiProperty({ description: 'Límite inferior del tramo (m³)' })
  tramoMin: number;

  @ApiProperty({ description: 'Límite superior del tramo (m³)' })
  tramoMax: number;

  @ApiProperty({ description: 'Precio por metro cúbico (Bs)' })
  precioM3: string;

  @ApiProperty({ description: 'Cargo fijo mensual (Bs)' })
  cargoFijo: string;

  @ApiPropertyOptional({ description: 'Estado' })
  estado?: boolean;
}

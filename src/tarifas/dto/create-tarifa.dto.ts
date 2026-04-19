import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTarifaDto {
  @ApiProperty()
  nombre: string;

  @ApiProperty()
  tramoMin: number;

  @ApiProperty()
  tramoMax: number;

  @ApiProperty()
  precioM3: string;

  @ApiProperty()
  cargoFijo: string;

  @ApiPropertyOptional()
  estado?: boolean;
}

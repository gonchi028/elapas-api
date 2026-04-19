import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorteDto {
  @ApiProperty()
  contratoId: string;

  @ApiProperty()
  motivo: string;

  @ApiPropertyOptional()
  fotoUrl?: string;

  @ApiPropertyOptional()
  latitud?: string;

  @ApiPropertyOptional()
  longitud?: string;
}

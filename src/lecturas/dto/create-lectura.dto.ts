import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLecturaDto {
  @ApiProperty()
  contratoId: string;

  @ApiProperty()
  valorLectura: number;

  @ApiPropertyOptional()
  fotoUrl?: string;

  @ApiPropertyOptional()
  latitud?: string;

  @ApiPropertyOptional()
  longitud?: string;
}

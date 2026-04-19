import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez' })
  nombre: string;

  @ApiProperty({ example: 'juan@example.com' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  password: string;

  @ApiProperty({
    example: 'brigadista',
    enum: ['admin', 'brigadista', 'ciudadano'],
  })
  role: string;
}

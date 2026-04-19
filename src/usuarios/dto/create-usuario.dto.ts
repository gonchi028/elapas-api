import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo' })
  nombre: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: 'Contraseña',
  })
  password: string;

  @ApiProperty({
    example: 'brigadista',
    enum: ['admin', 'brigadista', 'ciudadano'],
    description: 'Rol del usuario',
  })
  role: string;
}

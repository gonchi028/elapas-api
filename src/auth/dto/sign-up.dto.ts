import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Correo electrónico',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: 'Contraseña',
  })
  password: string;

  @ApiProperty({ example: 'Usuario de Prueba', description: 'Nombre completo' })
  name: string;
}

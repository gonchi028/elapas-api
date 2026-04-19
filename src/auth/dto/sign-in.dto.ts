import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Correo electrónico',
  })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña' })
  password: string;
}

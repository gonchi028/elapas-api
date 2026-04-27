import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Correo electrónico',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: 'Contraseña',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Usuario de Prueba', description: 'Nombre completo' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

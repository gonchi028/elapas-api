import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    example: 'juan@example.com',
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

  @ApiProperty({
    example: 'brigadista',
    enum: ['admin', 'brigadista', 'ciudadano'],
    description: 'Rol del usuario',
  })
  @IsString()
  @IsIn(['admin', 'brigadista', 'ciudadano'])
  role: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Nombre completo' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    enum: ['admin', 'brigadista', 'ciudadano'],
    description: 'Rol del usuario',
  })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'brigadista', 'ciudadano'])
  role?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

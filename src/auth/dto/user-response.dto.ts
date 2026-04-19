import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Identificador único' })
  id: string;

  @ApiProperty({ description: 'Nombre completo' })
  name: string;

  @ApiProperty({ description: 'Correo electrónico' })
  email: string;

  @ApiProperty({ description: 'Correo verificado' })
  emailVerified: boolean;

  @ApiProperty({ nullable: true, description: 'Imagen de perfil' })
  image: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: string;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: string;
}

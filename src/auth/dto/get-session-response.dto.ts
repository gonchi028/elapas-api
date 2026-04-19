import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

class SessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ nullable: true })
  ipAddress: string | null;

  @ApiProperty({ nullable: true })
  userAgent: string | null;

  @ApiProperty()
  userId: string;
}

export class GetSessionResponseDto {
  @ApiProperty({ type: SessionDto })
  session: SessionDto;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

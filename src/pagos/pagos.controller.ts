import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { ConfirmPagoDto } from './dto/confirm-pago.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('qr/:facturaId')
  @Roles('ciudadano')
  generateQr(@Param('facturaId') facturaId: string) {
    return this.pagosService.generateQr(facturaId);
  }

  @Post('confirmar')
  @Roles('ciudadano', 'admin')
  confirm(@Body() dto: ConfirmPagoDto) {
    return this.pagosService.confirm(dto);
  }

  @Get()
  @Roles('admin')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.pagosService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('mis-pagos')
  @Roles('ciudadano')
  findMisPagos(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.pagosService.findByUsuario(req.user.id);
  }
}

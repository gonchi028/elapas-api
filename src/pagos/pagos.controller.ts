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
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Generar código QR para pagar una factura' })
  @ApiParam({ name: 'facturaId', description: 'ID de la factura' })
  async generateQr(@Param('facturaId') facturaId: string) {
    const data = await this.pagosService.generateQr(facturaId);
    return { success: true, data };
  }

  @Post('confirmar')
  @Roles('ciudadano', 'admin')
  @ApiOperation({ summary: 'Confirmar un pago simulado' })
  async confirm(@Body() dto: ConfirmPagoDto) {
    const data = await this.pagosService.confirm(dto);
    return { success: true, data };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todos los pagos con paginación' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;
    const { data, total } = await this.pagosService.findAll(p, l);
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get('mis-pagos')
  @Roles('ciudadano')
  @ApiOperation({ summary: 'Listar pagos del usuario autenticado' })
  async findMisPagos(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.pagosService.findByUsuario(req.user.id);
    return { success: true, data };
  }
}

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
import { FacturasService } from './facturas.service';
import { GenerateFacturasDto } from './dto/generate-facturas.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Facturas')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  @Roles('admin')
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'periodo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('estado') estado?: string,
    @Query('periodo') periodo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;
    const { data, total } = await this.facturasService.findAll({
      estado,
      periodo,
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get('mis-facturas')
  @Roles('ciudadano')
  async findMisFacturas(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.facturasService.findByUsuario(req.user.id);
    return { success: true, data };
  }

  @Get(':id')
  @Roles('admin', 'ciudadano')
  async findOne(@Param('id') id: string) {
    const data = await this.facturasService.findOne(id);
    return { success: true, data };
  }

  @Post('generar')
  @Roles('admin')
  async generate(@Body() dto: GenerateFacturasDto) {
    const data = await this.facturasService.generate(
      dto.periodo,
      dto.fechaVencimiento,
    );
    return { success: true, data };
  }
}

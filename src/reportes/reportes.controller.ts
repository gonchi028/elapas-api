import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen-diario')
  async resumenDiario() {
    const data = await this.reportesService.resumenDiario();
    return { success: true, data };
  }

  @Get('recaudacion-por-distrito')
  async recaudacionPorDistrito() {
    const data = await this.reportesService.recaudacionPorDistrito();
    return { success: true, data };
  }

  @Get('cortes-por-distrito')
  async cortesPorDistrito() {
    const data = await this.reportesService.cortesPorDistrito();
    return { success: true, data };
  }

  @Get('lecturas-por-brigadista')
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  async lecturasPorBrigadista(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const data = await this.reportesService.lecturasPorBrigadista(
      fechaInicio,
      fechaFin,
    );
    return { success: true, data };
  }
}

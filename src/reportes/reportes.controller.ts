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
  resumenDiario() {
    return this.reportesService.resumenDiario();
  }

  @Get('recaudacion-por-distrito')
  recaudacionPorDistrito() {
    return this.reportesService.recaudacionPorDistrito();
  }

  @Get('cortes-por-distrito')
  cortesPorDistrito() {
    return this.reportesService.cortesPorDistrito();
  }

  @Get('lecturas-por-brigadista')
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  lecturasPorBrigadista(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reportesService.lecturasPorBrigadista(fechaInicio, fechaFin);
  }
}

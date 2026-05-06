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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LecturasService } from './lecturas.service';
import { CreateLecturaDto } from './dto/create-lectura.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Lecturas')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('lecturas')
export class LecturasController {
  constructor(private readonly lecturasService: LecturasService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar lecturas con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de lecturas' })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiQuery({ name: 'brigadistaId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('brigadistaId') brigadistaId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const { data, total } = await this.lecturasService.findAll({
      fechaInicio,
      fechaFin,
      brigadistaId,
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get('mi-ruta')
  @Roles('brigadista')
  @ApiOperation({
    summary: 'Obtener la ruta del día del brigadista autenticado',
    description:
      'Devuelve los contratos asignados al brigadista con su estado de lectura (pendiente/leído) para el periodo actual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contratos asignados con estado de lectura',
  })
  async findMiRuta(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.lecturasService.findMiRuta(req.user.id);
    return { success: true, data };
  }

  @Get('ruta/:brigadistaId')
  @Roles('brigadista')
  @ApiOperation({
    summary: '[DEPRECATED] Obtener lecturas de un brigadista',
    description:
      'Usar GET /api/lecturas/mi-ruta en su lugar. Este endpoint será eliminado en futuras versiones.',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Lecturas del brigadista' })
  async findByBrigadista(@Param('brigadistaId') brigadistaId: string) {
    const data = await this.lecturasService.findByBrigadista(brigadistaId);
    return { success: true, data };
  }

  @Get(':id')
  @Roles('admin', 'brigadista')
  @ApiOperation({ summary: 'Obtener una lectura por id' })
  @ApiResponse({ status: 200, description: 'Lectura encontrada' })
  @ApiResponse({ status: 404, description: 'Lectura no encontrada' })
  async findOne(@Param('id') id: string) {
    const data = await this.lecturasService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @Roles('brigadista')
  @ApiOperation({ summary: 'Registrar una nueva lectura' })
  @ApiResponse({ status: 201, description: 'Lectura registrada' })
  async create(@Req() req: any, @Body() dto: CreateLecturaDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.lecturasService.create(req.user.id, dto);
    return { success: true, data };
  }
}

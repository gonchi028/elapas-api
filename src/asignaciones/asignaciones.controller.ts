import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AsignacionesService } from './asignaciones.service';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';
import { UpdateAsignacionDto } from './dto/update-asignacion.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Asignaciones')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('asignaciones')
export class AsignacionesController {
  constructor(private readonly asignacionesService: AsignacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las asignaciones con paginación' })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones' })
  @ApiQuery({ name: 'brigadistaId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('brigadistaId') brigadistaId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const { data, total } = await this.asignacionesService.findAll({
      brigadistaId,
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get('brigadista/:brigadistaId')
  @ApiOperation({
    summary: 'Obtener todos los contratos asignados a un brigadista',
  })
  @ApiParam({
    name: 'brigadistaId',
    description: 'ID del brigadista',
  })
  @ApiResponse({ status: 200, description: 'Contratos asignados' })
  @ApiResponse({ status: 404, description: 'Brigadista no encontrado' })
  async findByBrigadista(@Param('brigadistaId') brigadistaId: string) {
    const data = await this.asignacionesService.findByBrigadista(brigadistaId);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({
    summary: 'Asignar contratos a un brigadista',
    description:
      'Asigna una lista de contratos a un brigadista. Omite duplicados y contratos inexistentes.',
  })
  @ApiResponse({ status: 201, description: 'Asignaciones creadas' })
  @ApiResponse({ status: 404, description: 'Brigadista no encontrado' })
  async create(@Body() dto: CreateAsignacionDto) {
    const data = await this.asignacionesService.create(dto);
    return { success: true, data };
  }

  @Put(':brigadistaId')
  @ApiOperation({
    summary: 'Reemplazar todas las asignaciones de un brigadista',
    description:
      'Elimina todas las asignaciones existentes del brigadista y crea nuevas con los contratos proporcionados.',
  })
  @ApiParam({
    name: 'brigadistaId',
    description: 'ID del brigadista',
  })
  @ApiResponse({
    status: 200,
    description: 'Asignaciones actualizadas',
  })
  async replace(
    @Param('brigadistaId') brigadistaId: string,
    @Body() dto: UpdateAsignacionDto,
  ) {
    const data = await this.asignacionesService.replace(brigadistaId, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una asignación individual' })
  @ApiParam({ name: 'id', description: 'ID de la asignación' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  async remove(@Param('id') id: string) {
    const data = await this.asignacionesService.remove(id);
    return { success: true, data };
  }
}

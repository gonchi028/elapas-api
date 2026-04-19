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
import { CortesService } from './cortes.service';
import { CreateCorteDto } from './dto/create-corte.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Cortes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('cortes')
export class CortesController {
  constructor(private readonly cortesService: CortesService) {}

  @Post()
  @Roles('brigadista')
  @ApiOperation({ summary: 'Registrar un nuevo corte' })
  @ApiResponse({ status: 201, description: 'Corte registrado' })
  async create(@Req() req: any, @Body() dto: CreateCorteDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.cortesService.create(req.user.id, dto);
    return { success: true, data };
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar cortes con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de cortes' })
  @ApiQuery({ name: 'distritoId', required: false })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('distritoId') distritoId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.cortesService.findAll(
      distritoId,
      fechaInicio,
      fechaFin,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result.data, pagination: result.pagination };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener un corte por id' })
  @ApiResponse({ status: 200, description: 'Corte encontrado' })
  @ApiResponse({ status: 404, description: 'Corte no encontrado' })
  async findOne(@Param('id') id: string) {
    const data = await this.cortesService.findOne(id);
    return { success: true, data };
  }
}

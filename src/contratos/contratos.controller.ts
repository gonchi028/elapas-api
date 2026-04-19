import {
  Controller,
  Get,
  Post,
  Put,
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
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Contratos')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  @Roles('admin', 'brigadista')
  @ApiOperation({ summary: 'Listar contratos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de contratos' })
  @ApiQuery({ name: 'distritoId', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('distritoId') distritoId?: string,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const { data, total } = await this.contratosService.findAll({
      distritoId,
      estado,
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get('mis-contratos')
  @Roles('ciudadano')
  @ApiOperation({ summary: 'Listar contratos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contratos del usuario' })
  async findMyContracts(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.contratosService.findByUsuario(req.user.id);
    return { success: true, data };
  }

  @Get(':id')
  @Roles('admin', 'brigadista', 'ciudadano')
  @ApiOperation({ summary: 'Obtener un contrato por id' })
  @ApiResponse({ status: 200, description: 'Contrato encontrado' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado' })
  async findOne(@Param('id') id: string) {
    const data = await this.contratosService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un nuevo contrato' })
  @ApiResponse({ status: 201, description: 'Contrato creado' })
  async create(@Body() dto: CreateContratoDto) {
    const data = await this.contratosService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un contrato' })
  @ApiResponse({ status: 200, description: 'Contrato actualizado' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateContratoDto) {
    const data = await this.contratosService.update(id, dto);
    return { success: true, data };
  }
}

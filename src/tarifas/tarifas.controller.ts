import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TarifasService } from './tarifas.service';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Tarifas')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('tarifas')
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  @Roles('admin', 'brigadista')
  @ApiOperation({ summary: 'Listar tarifas activas' })
  @ApiResponse({ status: 200, description: 'Lista de tarifas' })
  async findAll() {
    const data = await this.tarifasService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  @Roles('admin', 'brigadista')
  @ApiOperation({ summary: 'Obtener una tarifa por id' })
  @ApiResponse({ status: 200, description: 'Tarifa encontrada' })
  @ApiResponse({ status: 404, description: 'Tarifa no encontrada' })
  async findOne(@Param('id') id: string) {
    const data = await this.tarifasService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una nueva tarifa' })
  @ApiResponse({ status: 201, description: 'Tarifa creada' })
  async create(@Body() dto: CreateTarifaDto) {
    const data = await this.tarifasService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar una tarifa' })
  @ApiResponse({ status: 200, description: 'Tarifa actualizada' })
  @ApiResponse({ status: 404, description: 'Tarifa no encontrada' })
  async update(@Param('id') id: string, @Body() dto: CreateTarifaDto) {
    const data = await this.tarifasService.update(id, dto);
    return { success: true, data };
  }
}

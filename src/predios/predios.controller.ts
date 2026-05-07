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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PrediosService } from './predios.service';
import { CreatePredioDto } from './dto/create-predio.dto';
import { UpdatePredioDto } from './dto/update-predio.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Predios')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('predios')
export class PrediosController {
  constructor(private readonly prediosService: PrediosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los predios con paginación' })
  @ApiQuery({ name: 'distritoId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('distritoId') distritoId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const { data, total } = await this.prediosService.findAll({
      distritoId,
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un predio por ID' })
  @ApiParam({ name: 'id', description: 'ID del predio' })
  async findOne(@Param('id') id: string) {
    const data = await this.prediosService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo predio' })
  async create(@Body() dto: CreatePredioDto) {
    const data = await this.prediosService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un predio' })
  @ApiParam({ name: 'id', description: 'ID del predio' })
  async update(@Param('id') id: string, @Body() dto: UpdatePredioDto) {
    const data = await this.prediosService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un predio',
    description:
      'Solo se puede eliminar un predio si no tiene contratos asociados.',
  })
  @ApiParam({ name: 'id', description: 'ID del predio' })
  async remove(@Param('id') id: string) {
    const data = await this.prediosService.remove(id);
    return { success: true, data };
  }
}

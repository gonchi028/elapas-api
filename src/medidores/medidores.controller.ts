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
import { MedidoresService } from './medidores.service';
import { CreateMedidorDto } from './dto/create-medidor.dto';
import { UpdateMedidorDto } from './dto/update-medidor.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Medidores')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('medidores')
export class MedidoresController {
  constructor(private readonly medidoresService: MedidoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los medidores con paginación' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const { data, total } = await this.medidoresService.findAll({
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un medidor por ID' })
  @ApiParam({ name: 'id', description: 'ID del medidor' })
  async findOne(@Param('id') id: string) {
    const data = await this.medidoresService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo medidor' })
  async create(@Body() dto: CreateMedidorDto) {
    const data = await this.medidoresService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un medidor' })
  @ApiParam({ name: 'id', description: 'ID del medidor' })
  async update(@Param('id') id: string, @Body() dto: UpdateMedidorDto) {
    const data = await this.medidoresService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un medidor',
    description:
      'Solo se puede eliminar un medidor si no tiene contratos asociados.',
  })
  @ApiParam({ name: 'id', description: 'ID del medidor' })
  async remove(@Param('id') id: string) {
    const data = await this.medidoresService.remove(id);
    return { success: true, data };
  }
}

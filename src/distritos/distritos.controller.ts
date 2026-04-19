import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateDistritoDto } from './dto/create-distrito.dto';
import { UpdateDistritoDto } from './dto/update-distrito.dto';
import { DistritosService } from './distritos.service';

@ApiTags('Distritos')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('distritos')
export class DistritosController {
  constructor(private readonly distritosService: DistritosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los distritos' })
  @ApiResponse({ status: 200, description: 'Lista de distritos' })
  async findAll() {
    const data = await this.distritosService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un distrito por ID' })
  @ApiParam({ name: 'id', description: 'UUID del distrito' })
  @ApiResponse({ status: 200, description: 'Distrito encontrado' })
  @ApiResponse({ status: 404, description: 'Distrito no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.distritosService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo distrito' })
  @ApiResponse({ status: 201, description: 'Distrito creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() dto: CreateDistritoDto) {
    const data = await this.distritosService.create(dto);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un distrito' })
  @ApiParam({ name: 'id', description: 'UUID del distrito' })
  @ApiResponse({ status: 200, description: 'Distrito actualizado' })
  @ApiResponse({ status: 404, description: 'Distrito no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDistritoDto,
  ) {
    const data = await this.distritosService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un distrito' })
  @ApiParam({ name: 'id', description: 'UUID del distrito' })
  @ApiResponse({ status: 200, description: 'Distrito eliminado' })
  @ApiResponse({ status: 404, description: 'Distrito no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.distritosService.remove(id);
    return { success: true, data };
  }
}

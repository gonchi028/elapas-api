import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CortesService } from './cortes.service';
import { CreateCorteDto } from './dto/create-corte.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { createUploadConfig } from '../common/uploads/upload.config';

@ApiTags('Cortes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('cortes')
export class CortesController {
  constructor(private readonly cortesService: CortesService) {}

  @Post()
  @Roles('brigadista')
  @ApiOperation({ summary: 'Registrar un nuevo corte con fotografía' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['contratoId', 'motivo'],
      properties: {
        contratoId: { type: 'string', description: 'ID del contrato' },
        motivo: { type: 'string', description: 'Motivo del corte' },
        foto: {
          type: 'string',
          format: 'binary',
          description: 'Fotografía de evidencia (JPEG, PNG, WebP, máx 5MB)',
        },
        latitud: { type: 'string', description: 'Latitud GPS' },
        longitud: { type: 'string', description: 'Longitud GPS' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Corte registrado' })
  @UseInterceptors(FileInterceptor('foto', createUploadConfig('cortes')))
  async create(
    @Req() req: any,
    @Body() dto: CreateCorteDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fotoUrl = file ? `/uploads/cortes/${file.filename}` : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const data = await this.cortesService.create(req.user.id, dto, fotoUrl);
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
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    const { data, total } = await this.cortesService.findAll({
      distritoId,
      fechaInicio,
      fechaFin,
      page: p,
      limit: l,
    });
    return { success: true, data, pagination: { page: p, limit: l, total } };
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

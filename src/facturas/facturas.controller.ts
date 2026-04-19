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
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { GenerateFacturasDto } from './dto/generate-facturas.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Facturas')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  @Roles('admin')
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'periodo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('estado') estado?: string,
    @Query('periodo') periodo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.facturasService.findAll(
      estado,
      periodo,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('mis-facturas')
  @Roles('ciudadano')
  findMisFacturas(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.facturasService.findByUsuario(req.user.id);
  }

  @Get(':id')
  @Roles('admin', 'ciudadano')
  findOne(@Param('id') id: string) {
    return this.facturasService.findOne(id);
  }

  @Post('generar')
  @Roles('admin')
  generate(@Body() dto: GenerateFacturasDto) {
    return this.facturasService.generate(dto.periodo, dto.fechaVencimiento);
  }
}

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
  @ApiOperation({ summary: 'Get all distritos' })
  @ApiResponse({ status: 200, description: 'List of distritos' })
  findAll() {
    return this.distritosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a distrito by id' })
  @ApiParam({ name: 'id', description: 'Distrito UUID' })
  @ApiResponse({ status: 200, description: 'Distrito found' })
  @ApiResponse({ status: 404, description: 'Distrito not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.distritosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new distrito' })
  @ApiResponse({ status: 201, description: 'Distrito created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateDistritoDto) {
    return this.distritosService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a distrito' })
  @ApiParam({ name: 'id', description: 'Distrito UUID' })
  @ApiResponse({ status: 200, description: 'Distrito updated' })
  @ApiResponse({ status: 404, description: 'Distrito not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDistritoDto,
  ) {
    return this.distritosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a distrito' })
  @ApiParam({ name: 'id', description: 'Distrito UUID' })
  @ApiResponse({ status: 200, description: 'Distrito deleted' })
  @ApiResponse({ status: 404, description: 'Distrito not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.distritosService.remove(id);
  }
}

import { Module } from '@nestjs/common';
import { DistritosController } from './distritos.controller';
import { DistritosService } from './distritos.service';

@Module({
  controllers: [DistritosController],
  providers: [DistritosService],
  exports: [DistritosService],
})
export class DistritosModule {}

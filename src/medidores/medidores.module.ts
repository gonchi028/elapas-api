import { Module } from '@nestjs/common';
import { MedidoresController } from './medidores.controller';
import { MedidoresService } from './medidores.service';

@Module({
  controllers: [MedidoresController],
  providers: [MedidoresService],
  exports: [MedidoresService],
})
export class MedidoresModule {}

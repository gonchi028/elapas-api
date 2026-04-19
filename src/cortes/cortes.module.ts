import { Module } from '@nestjs/common';
import { CortesController } from './cortes.controller';
import { CortesService } from './cortes.service';

@Module({
  controllers: [CortesController],
  providers: [CortesService],
  exports: [CortesService],
})
export class CortesModule {}

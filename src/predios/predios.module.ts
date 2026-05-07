import { Module } from '@nestjs/common';
import { PrediosController } from './predios.controller';
import { PrediosService } from './predios.service';

@Module({
  controllers: [PrediosController],
  providers: [PrediosService],
  exports: [PrediosService],
})
export class PrediosModule {}

import { Module } from '@nestjs/common';
import { LecturasController } from './lecturas.controller';
import { LecturasService } from './lecturas.service';

@Module({
  controllers: [LecturasController],
  providers: [LecturasService],
  exports: [LecturasService],
})
export class LecturasModule {}

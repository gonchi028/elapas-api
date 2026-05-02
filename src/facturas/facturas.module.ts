import { Module } from '@nestjs/common';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { PdfService } from '../common/pdf/pdf.service';

@Module({
  controllers: [FacturasController],
  providers: [FacturasService, PdfService],
})
export class FacturasModule {}

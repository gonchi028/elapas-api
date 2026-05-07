import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { DistritosModule } from './distritos/distritos.module';
import { ContratosModule } from './contratos/contratos.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { LecturasModule } from './lecturas/lecturas.module';
import { FacturasModule } from './facturas/facturas.module';
import { PagosModule } from './pagos/pagos.module';
import { CortesModule } from './cortes/cortes.module';
import { ReportesModule } from './reportes/reportes.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';
import { PrediosModule } from './predios/predios.module';
import { MedidoresModule } from './medidores/medidores.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    UsuariosModule,
    DistritosModule,
    PrediosModule,
    MedidoresModule,
    ContratosModule,
    TarifasModule,
    LecturasModule,
    FacturasModule,
    PagosModule,
    CortesModule,
    ReportesModule,
    AsignacionesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

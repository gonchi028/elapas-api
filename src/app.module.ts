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

@Module({
  imports: [
    DbModule,
    AuthModule,
    UsuariosModule,
    DistritosModule,
    ContratosModule,
    TarifasModule,
    LecturasModule,
    FacturasModule,
    PagosModule,
    CortesModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

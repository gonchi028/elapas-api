import { Module, Global } from '@nestjs/common';
import { DB_PROVIDER, db } from './connection';

@Global()
@Module({
  providers: [
    {
      provide: DB_PROVIDER,
      useValue: db,
    },
  ],
  exports: [DB_PROVIDER],
})
export class DbModule {}

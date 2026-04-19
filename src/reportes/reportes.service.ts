import { Inject, Injectable } from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import {
  pago,
  factura,
  contrato,
  lectura,
  corte,
  distrito,
  user,
} from '../db/schema';
import { SQL, eq, and, sql, gte, lte, count } from 'drizzle-orm';

@Injectable()
export class ReportesService {
  constructor(@Inject(DB_PROVIDER) private readonly db: Database) {}

  async resumenDiario() {
    const [lecturasResult, cortesResult, pagosResult, contratosResult] =
      await Promise.all([
        this.db
          .select({ count: count() })
          .from(lectura)
          .where(sql`DATE(${lectura.fechaLectura}) = CURRENT_DATE`),
        this.db
          .select({ count: count() })
          .from(corte)
          .where(sql`DATE(${corte.createdAt}) = CURRENT_DATE`),
        this.db
          .select({ total: sql<string>`coalesce(sum(${pago.monto}), 0)` })
          .from(pago)
          .where(sql`DATE(${pago.fechaPago}) = CURRENT_DATE`),
        this.db
          .select({ count: count() })
          .from(contrato)
          .where(
            eq(
              contrato.estado,
              'activo' as 'activo' | 'suspendido' | 'cortado',
            ),
          ),
      ]);

    return {
      lecturasHoy: Number(lecturasResult[0].count),
      cortesHoy: Number(cortesResult[0].count),
      recaudacionHoy: parseFloat(pagosResult[0].total),
      contratosActivos: Number(contratosResult[0].count),
    };
  }

  async recaudacionPorDistrito() {
    const rows = await this.db
      .select({
        distrito: distrito.nombre,
        total: sql<string>`coalesce(sum(${pago.monto}), 0)`,
      })
      .from(pago)
      .innerJoin(factura, eq(pago.facturaId, factura.id))
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .innerJoin(distrito, eq(contrato.distritoId, distrito.id))
      .groupBy(distrito.nombre);

    return rows.map((r) => ({
      distrito: r.distrito,
      total: parseFloat(r.total),
    }));
  }

  async cortesPorDistrito() {
    const rows = await this.db
      .select({
        distrito: distrito.nombre,
        cantidad: count(),
      })
      .from(corte)
      .innerJoin(contrato, eq(corte.contratoId, contrato.id))
      .innerJoin(distrito, eq(contrato.distritoId, distrito.id))
      .groupBy(distrito.nombre);

    return rows.map((r) => ({
      distrito: r.distrito,
      cantidad: Number(r.cantidad),
    }));
  }

  async lecturasPorBrigadista(fechaInicio?: string, fechaFin?: string) {
    const conditions: (SQL | undefined)[] = [];
    if (fechaInicio)
      conditions.push(gte(lectura.fechaLectura, new Date(fechaInicio)));
    if (fechaFin)
      conditions.push(lte(lectura.fechaLectura, new Date(fechaFin)));
    const where = conditions.filter(Boolean).length
      ? and(...conditions.filter(Boolean))
      : undefined;

    const rows = await this.db
      .select({
        brigadista: sql<string>`coalesce(${user.name}, 'Sin asignar')`,
        cantidad: count(),
      })
      .from(lectura)
      .innerJoin(user, eq(lectura.brigadistaId, user.id))
      .where(where)
      .groupBy(user.name);

    return rows.map((r) => ({
      brigadista: r.brigadista,
      cantidad: Number(r.cantidad),
    }));
  }
}

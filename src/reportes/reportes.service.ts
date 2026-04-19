import { Injectable } from '@nestjs/common';
import { db } from '../db/connection';
import {
  pago,
  factura,
  contrato,
  lectura,
  corte,
  distrito,
  user,
} from '../db/schema';
import { SQL, eq, and, sql, gte, lte } from 'drizzle-orm';

@Injectable()
export class ReportesService {
  async resumenDiario() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [lecturasResult, cortesResult, pagosResult, contratosResult] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(lectura)
          .where(
            and(
              gte(lectura.fechaLectura, today),
              lte(lectura.fechaLectura, tomorrow),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(corte)
          .where(
            and(gte(corte.createdAt, today), lte(corte.createdAt, tomorrow)),
          ),
        db
          .select({ total: sql<string>`coalesce(sum(${pago.monto}), 0)` })
          .from(pago)
          .where(
            and(gte(pago.fechaPago, today), lte(pago.fechaPago, tomorrow)),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(contrato)
          .where(eq(contrato.estado, 'activo' as any)),
      ]);

    return {
      success: true,
      data: {
        lecturasHoy: Number(lecturasResult[0].count),
        cortesHoy: Number(cortesResult[0].count),
        recaudacionHoy: parseFloat(pagosResult[0].total),
        contratosActivos: Number(contratosResult[0].count),
      },
    };
  }

  async recaudacionPorDistrito() {
    const data = await db
      .select({
        distrito: distrito.nombre,
        total: sql<string>`coalesce(sum(${pago.monto}), 0)`,
      })
      .from(pago)
      .innerJoin(factura, eq(pago.facturaId, factura.id))
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .innerJoin(distrito, eq(contrato.distritoId, distrito.id))
      .groupBy(distrito.nombre);

    return {
      success: true,
      data: data.map((r) => ({
        distrito: r.distrito,
        total: parseFloat(r.total),
      })),
    };
  }

  async cortesPorDistrito() {
    const data = await db
      .select({
        distrito: distrito.nombre,
        cantidad: sql<number>`count(*)`,
      })
      .from(corte)
      .innerJoin(contrato, eq(corte.contratoId, contrato.id))
      .innerJoin(distrito, eq(contrato.distritoId, distrito.id))
      .groupBy(distrito.nombre);

    return {
      success: true,
      data: data.map((r) => ({
        distrito: r.distrito,
        cantidad: Number(r.cantidad),
      })),
    };
  }

  async lecturasPorBrigadista(fechaInicio?: string, fechaFin?: string) {
    const conditions: SQL[] = [];
    if (fechaInicio)
      conditions.push(gte(lectura.fechaLectura, new Date(fechaInicio)));
    if (fechaFin)
      conditions.push(lte(lectura.fechaLectura, new Date(fechaFin)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        brigadista: sql<string>`coalesce(${user.name}, 'Sin asignar')`,
        cantidad: sql<number>`count(*)`,
      })
      .from(lectura)
      .innerJoin(user, eq(lectura.brigadistaId, user.id))
      .where(whereClause)
      .groupBy(user.name);

    return {
      success: true,
      data: data.map((r) => ({
        brigadista: r.brigadista,
        cantidad: Number(r.cantidad),
      })),
    };
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import {
  factura,
  contrato,
  lectura,
  tarifa,
  user,
  predio,
  medidor,
  distrito,
  type contratoEstadoEnum,
  type facturaEstadoEnum,
} from '../db/schema';
import { eq, and, desc, count, SQL } from 'drizzle-orm';

@Injectable()
export class FacturasService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: {
    estado?: string;
    periodo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];
    if (filters.estado)
      conditions.push(
        eq(
          factura.estado,
          filters.estado as (typeof facturaEstadoEnum.enumValues)[number],
        ),
      );
    if (filters.periodo) conditions.push(eq(factura.periodo, filters.periodo));
    const where = conditions.filter(Boolean).length
      ? and(...conditions.filter(Boolean))
      : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(factura)
        .where(where)
        .orderBy(desc(factura.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(factura).where(where),
    ]);

    return { data, total: totalResult[0].total };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(factura)
      .where(eq(factura.id, id));

    if (!result) {
      throw new NotFoundException(`Factura ${id} no encontrada`);
    }

    return result;
  }

  async findByUsuario(usuarioId: string) {
    const rows = await this.db
      .select()
      .from(factura)
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(factura.createdAt));

    return rows.map((r) => r.factura);
  }

  async generate(periodo: string, fechaVencimiento: string) {
    let generated = 0;

    await this.db.transaction(async (tx) => {
      const contratos = await tx
        .select()
        .from(contrato)
        .where(
          eq(
            contrato.estado,
            'activo' as (typeof contratoEstadoEnum.enumValues)[number],
          ),
        );

      const tarifas = await tx.select().from(tarifa);

      for (const c of contratos) {
        const lecturas = await tx
          .select()
          .from(lectura)
          .where(eq(lectura.contratoId, c.id))
          .orderBy(desc(lectura.fechaLectura))
          .limit(2);

        if (lecturas.length < 2) continue;

        const latest = lecturas[0];
        const previous = lecturas[1];
        const consumoM3 = latest.valorLectura - previous.valorLectura;

        if (consumoM3 < 0) continue;

        const tarifaAplicable = tarifas.find(
          (t) =>
            consumoM3 >= (t.tramoMin ?? 0) &&
            consumoM3 <= (t.tramoMax ?? Infinity),
        );

        if (!tarifaAplicable) continue;

        const subtotal =
          consumoM3 * parseFloat(tarifaAplicable.precioM3 ?? '0');
        const cargoFijo = parseFloat(tarifaAplicable.cargoFijo ?? '0');
        const total = subtotal + cargoFijo;

        await tx.insert(factura).values({
          contratoId: c.id,
          lecturaId: latest.id,
          periodo,
          consumoM3,
          tarifaId: tarifaAplicable.id,
          cargoFijo: cargoFijo.toString(),
          subtotal: subtotal.toString(),
          total: total.toString(),
          estado: 'pendiente' as (typeof facturaEstadoEnum.enumValues)[number],
          fechaVencimiento,
        });

        generated++;
      }
    });

    return generated;
  }

  async findDetail(id: string) {
    const rows = await this.db
      .select()
      .from(factura)
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .innerJoin(user, eq(contrato.usuarioId, user.id))
      .innerJoin(predio, eq(contrato.predioId, predio.id))
      .innerJoin(medidor, eq(contrato.medidorId, medidor.id))
      .innerJoin(distrito, eq(predio.distritoId, distrito.id))
      .innerJoin(lectura, eq(factura.lecturaId, lectura.id))
      .innerJoin(tarifa, eq(factura.tarifaId, tarifa.id))
      .where(eq(factura.id, id));

    if (!rows.length) {
      throw new NotFoundException(`Factura ${id} no encontrada`);
    }

    const row = rows[0];
    return {
      factura: row.factura,
      contrato: row.contrato,
      usuario: row.user,
      predio: row.predio,
      medidor: row.medidor,
      distrito: row.distrito,
      lectura: row.lectura,
      tarifa: row.tarifa,
    };
  }
}

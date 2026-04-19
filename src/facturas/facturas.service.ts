import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { factura, contrato, lectura, tarifa } from '../db/schema';
import { SQL, eq, and, desc, count } from 'drizzle-orm';

@Injectable()
export class FacturasService {
  async findAll(estado?: string, periodo?: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];
    if (estado) conditions.push(eq(factura.estado, estado as any));
    if (periodo) conditions.push(eq(factura.periodo, periodo));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(factura)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(factura.createdAt)),
      db.select({ total: count() }).from(factura).where(whereClause),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: totalResult[0].total,
      },
    };
  }

  async findOne(id: string) {
    const result = await db.select().from(factura).where(eq(factura.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Factura ${id} no encontrada`);
    }
    return { success: true, data: result[0] };
  }

  async findByUsuario(usuarioId: string) {
    const data = await db
      .select()
      .from(factura)
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(factura.createdAt));

    return { success: true, data: data.map((r) => r.factura) };
  }

  async generate(periodo: string, fechaVencimiento: string) {
    let generated = 0;

    await db.transaction(async (tx) => {
      const contratos = await tx
        .select()
        .from(contrato)
        .where(eq(contrato.estado, 'activo' as any));

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

        const tarifas = await tx.select().from(tarifa);

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
          estado: 'pendiente',
          fechaVencimiento: fechaVencimiento,
        });

        generated++;
      }
    });

    return {
      success: true,
      data: { generated, message: `Se generaron ${generated} facturas` },
    };
  }
}

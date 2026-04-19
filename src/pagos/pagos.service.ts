import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { pago, factura, contrato } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';

@Injectable()
export class PagosService {
  async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(pago)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(pago.createdAt)),
      db.select({ total: count() }).from(pago),
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

  async findByUsuario(usuarioId: string) {
    const data = await db
      .select()
      .from(pago)
      .innerJoin(factura, eq(pago.facturaId, factura.id))
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(pago.createdAt));

    return { success: true, data: data.map((r) => r.pago) };
  }

  async generateQr(facturaId: string) {
    const facturaResult = await db
      .select()
      .from(factura)
      .where(eq(factura.id, facturaId));

    if (facturaResult.length === 0) {
      throw new NotFoundException(`Factura ${facturaId} no encontrada`);
    }

    const f = facturaResult[0];
    const qrData = JSON.stringify({
      facturaId: f.id,
      monto: f.total,
      entidad: 'ELAPAS',
      fecha: new Date().toISOString(),
    });

    await db.insert(pago).values({
      facturaId: f.id,
      monto: f.total,
      metodoPago: 'qr_simple',
      qrData,
    });

    return { success: true, data: { qrData } };
  }

  async confirm(dto: {
    facturaId: string;
    monto: string;
    metodoPago?: string;
    referencia?: string;
  }) {
    const facturaResult = await db
      .select()
      .from(factura)
      .where(eq(factura.id, dto.facturaId));

    if (facturaResult.length === 0) {
      throw new NotFoundException(`Factura ${dto.facturaId} no encontrada`);
    }

    const result = await db
      .insert(pago)
      .values({
        facturaId: dto.facturaId,
        monto: dto.monto,
        metodoPago: (dto.metodoPago ?? 'efectivo') as
          | 'qr_simple'
          | 'efectivo'
          | 'transferencia',
        referencia: dto.referencia,
        fechaPago: new Date(),
      })
      .returning();

    await db
      .update(factura)
      .set({ estado: 'pagada' })
      .where(eq(factura.id, dto.facturaId));

    return { success: true, data: result[0] };
  }
}

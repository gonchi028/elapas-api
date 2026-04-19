import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import { pago, factura, contrato } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';

@Injectable()
export class PagosService {
  constructor(@Inject(DB_PROVIDER) private readonly db: Database) {}

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(pago)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(pago.createdAt)),
      this.db.select({ total: count() }).from(pago),
    ]);

    return { data, total: totalResult[0].total };
  }

  async findByUsuario(usuarioId: string) {
    const rows = await this.db
      .select()
      .from(pago)
      .innerJoin(factura, eq(pago.facturaId, factura.id))
      .innerJoin(contrato, eq(factura.contratoId, contrato.id))
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(pago.createdAt));

    return rows.map((r) => r.pago);
  }

  async generateQr(facturaId: string) {
    const [f] = await this.db
      .select()
      .from(factura)
      .where(eq(factura.id, facturaId));

    if (!f) {
      throw new NotFoundException(`Factura ${facturaId} no encontrada`);
    }

    if (f.estado !== 'pendiente') {
      throw new BadRequestException('La factura ya está pagada');
    }

    const qrData = JSON.stringify({
      facturaId: f.id,
      monto: f.total,
      entidad: 'ELAPAS',
      fecha: new Date().toISOString(),
    });

    await this.db.insert(pago).values({
      facturaId: f.id,
      monto: f.total,
      metodoPago: 'qr_simple' as const,
      qrData,
    });

    return { qrData };
  }

  async confirm(dto: {
    facturaId: string;
    monto: string;
    metodoPago?: string;
    referencia?: string;
  }) {
    const [f] = await this.db
      .select()
      .from(factura)
      .where(eq(factura.id, dto.facturaId));

    if (!f) {
      throw new NotFoundException(`Factura ${dto.facturaId} no encontrada`);
    }

    const pagoCreado = await this.db.transaction(async (tx) => {
      const [p] = await tx
        .insert(pago)
        .values({
          facturaId: dto.facturaId,
          monto: dto.monto,
          metodoPago: (dto.metodoPago ?? 'efectivo') as
            | 'qr_simple'
            | 'efectivo'
            | 'transferencia',
          referencia: dto.referencia,
        })
        .returning();

      await tx
        .update(factura)
        .set({
          estado: 'pagada' as 'pendiente' | 'pagada' | 'vencida',
        })
        .where(eq(factura.id, dto.facturaId));

      return p;
    });

    return pagoCreado;
  }
}

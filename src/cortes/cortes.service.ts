import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { corte, contrato } from '../db/schema';
import { SQL, eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { CreateCorteDto } from './dto/create-corte.dto';

@Injectable()
export class CortesService {
  async findAll(
    distritoId?: string,
    fechaInicio?: string,
    fechaFin?: string,
    page = 1,
    limit = 20,
  ) {
    const conditions: SQL[] = [];

    if (distritoId) {
      conditions.push(eq(contrato.distritoId, distritoId));
    }

    if (fechaInicio) {
      conditions.push(gte(corte.fechaCorte, new Date(fechaInicio)));
    }

    if (fechaFin) {
      conditions.push(lte(corte.fechaCorte, new Date(fechaFin)));
    }

    const offset = (page - 1) * limit;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(corte)
      .innerJoin(contrato, eq(corte.contratoId, contrato.id))
      .where(whereClause);

    const total = countResult.count;

    const data = await db
      .select({
        id: corte.id,
        contratoId: corte.contratoId,
        brigadistaId: corte.brigadistaId,
        motivo: corte.motivo,
        fotoUrl: corte.fotoUrl,
        latitud: corte.latitud,
        longitud: corte.longitud,
        fechaCorte: corte.fechaCorte,
        estado: corte.estado,
        createdAt: corte.createdAt,
      })
      .from(corte)
      .innerJoin(contrato, eq(corte.contratoId, contrato.id))
      .where(whereClause)
      .orderBy(desc(corte.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: { page, limit, total },
    };
  }

  async findOne(id: string) {
    const [result] = await db.select().from(corte).where(eq(corte.id, id));

    if (!result) {
      throw new NotFoundException(`Corte con id ${id} no encontrado`);
    }

    return result;
  }

  async create(brigadistaId: string, dto: CreateCorteDto) {
    const [result] = await db
      .insert(corte)
      .values({
        contratoId: dto.contratoId,
        brigadistaId,
        motivo: dto.motivo,
        fotoUrl: dto.fotoUrl,
        latitud: dto.latitud,
        longitud: dto.longitud,
      })
      .returning();

    await db
      .update(contrato)
      .set({ estado: 'cortado' })
      .where(eq(contrato.id, dto.contratoId));

    return result;
  }
}

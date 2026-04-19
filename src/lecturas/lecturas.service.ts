import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { lectura } from '../db/schema';
import { SQL, eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { CreateLecturaDto } from './dto/create-lectura.dto';

@Injectable()
export class LecturasService {
  async findAll(
    fechaInicio?: string,
    fechaFin?: string,
    brigadistaId?: string,
    page = 1,
    limit = 20,
  ) {
    const conditions: SQL[] = [];

    if (fechaInicio) {
      conditions.push(gte(lectura.fechaLectura, new Date(fechaInicio)));
    }

    if (fechaFin) {
      conditions.push(lte(lectura.fechaLectura, new Date(fechaFin)));
    }

    if (brigadistaId) {
      conditions.push(eq(lectura.brigadistaId, brigadistaId));
    }

    const offset = (page - 1) * limit;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lectura)
      .where(whereClause);

    const total = countResult.count;

    const data = await db
      .select()
      .from(lectura)
      .where(whereClause)
      .orderBy(desc(lectura.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: { page, limit, total },
    };
  }

  async findOne(id: string) {
    const [result] = await db.select().from(lectura).where(eq(lectura.id, id));

    if (!result) {
      throw new NotFoundException(`Lectura con id ${id} no encontrada`);
    }

    return result;
  }

  async findByBrigadista(brigadistaId: string) {
    const data = await db
      .select()
      .from(lectura)
      .where(eq(lectura.brigadistaId, brigadistaId))
      .orderBy(desc(lectura.createdAt));

    return data;
  }

  async create(brigadistaId: string, dto: CreateLecturaDto) {
    const [result] = await db
      .insert(lectura)
      .values({
        contratoId: dto.contratoId,
        brigadistaId,
        valorLectura: dto.valorLectura,
        fotoUrl: dto.fotoUrl,
        latitud: dto.latitud,
        longitud: dto.longitud,
      })
      .returning();

    return result;
  }
}

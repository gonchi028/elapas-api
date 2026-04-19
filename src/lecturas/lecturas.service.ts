import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import { lectura } from '../db/schema';
import { SQL, eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { CreateLecturaDto } from './dto/create-lectura.dto';

@Injectable()
export class LecturasService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: {
    fechaInicio?: string;
    fechaFin?: string;
    brigadistaId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];
    if (filters.fechaInicio)
      conditions.push(gte(lectura.fechaLectura, new Date(filters.fechaInicio)));
    if (filters.fechaFin)
      conditions.push(lte(lectura.fechaLectura, new Date(filters.fechaFin)));
    if (filters.brigadistaId)
      conditions.push(eq(lectura.brigadistaId, filters.brigadistaId));
    const where = conditions.filter(Boolean).length
      ? and(...conditions.filter(Boolean))
      : undefined;

    const [countResult, data] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(lectura)
        .where(where),
      this.db
        .select()
        .from(lectura)
        .where(where)
        .orderBy(desc(lectura.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return { data, total: countResult[0].count };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(lectura)
      .where(eq(lectura.id, id));

    if (!result) {
      throw new NotFoundException(`Lectura con id ${id} no encontrada`);
    }

    return result;
  }

  async findByBrigadista(brigadistaId: string) {
    return this.db
      .select()
      .from(lectura)
      .where(eq(lectura.brigadistaId, brigadistaId))
      .orderBy(desc(lectura.createdAt));
  }

  async create(brigadistaId: string, dto: CreateLecturaDto) {
    const [result] = await this.db
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

import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import { predio, contrato } from '../db/schema';
import { SQL, eq, and, sql, desc } from 'drizzle-orm';
import { CreatePredioDto } from './dto/create-predio.dto';
import { UpdatePredioDto } from './dto/update-predio.dto';

@Injectable()
export class PrediosService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: {
    distritoId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];
    if (filters.distritoId)
      conditions.push(eq(predio.distritoId, filters.distritoId));
    const where = conditions.filter(Boolean).length
      ? and(...conditions.filter(Boolean))
      : undefined;

    const [countResult, data] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(predio)
        .where(where),
      this.db
        .select()
        .from(predio)
        .where(where)
        .orderBy(desc(predio.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return { data, total: countResult[0].count };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(predio)
      .where(eq(predio.id, id));

    if (!result) {
      throw new NotFoundException(`Predio con id ${id} no encontrado`);
    }

    return result;
  }

  async create(dto: CreatePredioDto) {
    const [result] = await this.db
      .insert(predio)
      .values({
        distritoId: dto.distritoId,
        direccion: dto.direccion,
        latitud: dto.latitud,
        longitud: dto.longitud,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdatePredioDto) {
    await this.findOne(id);

    const values: Partial<typeof predio.$inferInsert> = {};

    if (dto.distritoId !== undefined) values.distritoId = dto.distritoId;
    if (dto.direccion !== undefined) values.direccion = dto.direccion;
    if (dto.latitud !== undefined) values.latitud = dto.latitud;
    if (dto.longitud !== undefined) values.longitud = dto.longitud;

    const [result] = await this.db
      .update(predio)
      .set(values)
      .where(eq(predio.id, id))
      .returning();

    return result;
  }

  async remove(id: string) {
    await this.findOne(id);

    const linked = await this.db
      .select({ id: contrato.id })
      .from(contrato)
      .where(eq(contrato.predioId, id))
      .limit(1);

    if (linked.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar el predio porque tiene contratos asociados',
      );
    }

    const [deleted] = await this.db
      .delete(predio)
      .where(eq(predio.id, id))
      .returning();

    return deleted;
  }
}

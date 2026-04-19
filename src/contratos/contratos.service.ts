import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import { contrato, type contratoEstadoEnum } from '../db/schema';
import { SQL, eq, and, sql, desc } from 'drizzle-orm';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

@Injectable()
export class ContratosService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: {
    distritoId?: string;
    estado?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];
    if (filters.distritoId)
      conditions.push(eq(contrato.distritoId, filters.distritoId));
    if (filters.estado)
      conditions.push(
        eq(
          contrato.estado,
          filters.estado as (typeof contratoEstadoEnum.enumValues)[number],
        ),
      );
    const where = conditions.filter(Boolean).length
      ? and(...conditions.filter(Boolean))
      : undefined;

    const [countResult, data] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contrato)
        .where(where),
      this.db
        .select()
        .from(contrato)
        .where(where)
        .orderBy(desc(contrato.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return { data, total: countResult[0].count };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(contrato)
      .where(eq(contrato.id, id));

    if (!result) {
      throw new NotFoundException(`Contrato con id ${id} no encontrado`);
    }

    return result;
  }

  async findByUsuario(usuarioId: string) {
    return this.db
      .select()
      .from(contrato)
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(contrato.createdAt));
  }

  async create(dto: CreateContratoDto) {
    const [result] = await this.db
      .insert(contrato)
      .values({
        nroContrato: dto.nroContrato,
        usuarioId: dto.usuarioId,
        distritoId: dto.distritoId,
        direccion: dto.direccion,
        nroMedidor: dto.nroMedidor,
        latitud: dto.latitud,
        longitud: dto.longitud,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdateContratoDto) {
    await this.findOne(id);

    const values: Partial<typeof contrato.$inferInsert> = {};

    if (dto.nroContrato !== undefined) values.nroContrato = dto.nroContrato;
    if (dto.usuarioId !== undefined) values.usuarioId = dto.usuarioId;
    if (dto.distritoId !== undefined) values.distritoId = dto.distritoId;
    if (dto.direccion !== undefined) values.direccion = dto.direccion;
    if (dto.nroMedidor !== undefined) values.nroMedidor = dto.nroMedidor;
    if (dto.latitud !== undefined) values.latitud = dto.latitud;
    if (dto.longitud !== undefined) values.longitud = dto.longitud;
    if (dto.estado !== undefined)
      values.estado =
        dto.estado as (typeof contratoEstadoEnum.enumValues)[number];

    const [result] = await this.db
      .update(contrato)
      .set(values)
      .where(eq(contrato.id, id))
      .returning();

    return result;
  }
}

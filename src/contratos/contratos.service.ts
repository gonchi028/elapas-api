import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import {
  contrato,
  predio,
  medidor,
  distrito,
  type contratoEstadoEnum,
} from '../db/schema';
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
      conditions.push(eq(predio.distritoId, filters.distritoId));
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
        .innerJoin(predio, eq(contrato.predioId, predio.id))
        .where(where),
      this.db
        .select({
          contrato,
          predio,
          medidor,
        })
        .from(contrato)
        .innerJoin(predio, eq(contrato.predioId, predio.id))
        .innerJoin(medidor, eq(contrato.medidorId, medidor.id))
        .where(where)
        .orderBy(desc(contrato.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return { data, total: countResult[0].count };
  }

  async findOne(id: string) {
    const rows = await this.db
      .select({
        contrato,
        predio,
        medidor,
        distrito,
      })
      .from(contrato)
      .innerJoin(predio, eq(contrato.predioId, predio.id))
      .innerJoin(medidor, eq(contrato.medidorId, medidor.id))
      .innerJoin(distrito, eq(predio.distritoId, distrito.id))
      .where(eq(contrato.id, id));

    if (!rows.length) {
      throw new NotFoundException(`Contrato con id ${id} no encontrado`);
    }

    return rows[0];
  }

  async findByUsuario(usuarioId: string) {
    return this.db
      .select({
        contrato,
        predio,
        medidor,
      })
      .from(contrato)
      .innerJoin(predio, eq(contrato.predioId, predio.id))
      .innerJoin(medidor, eq(contrato.medidorId, medidor.id))
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(contrato.createdAt));
  }

  async create(dto: CreateContratoDto) {
    const [result] = await this.db
      .insert(contrato)
      .values({
        nroContrato: dto.nroContrato,
        usuarioId: dto.usuarioId,
        predioId: dto.predioId,
        medidorId: dto.medidorId,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdateContratoDto) {
    await this.findOne(id);

    const values: Partial<typeof contrato.$inferInsert> = {};

    if (dto.nroContrato !== undefined) values.nroContrato = dto.nroContrato;
    if (dto.usuarioId !== undefined) values.usuarioId = dto.usuarioId;
    if (dto.predioId !== undefined) values.predioId = dto.predioId;
    if (dto.medidorId !== undefined) values.medidorId = dto.medidorId;
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

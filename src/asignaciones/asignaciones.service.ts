import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import {
  asignacion,
  contrato,
  user,
  distrito,
  type roleEnum,
} from '../db/schema';
import { eq, and, sql, inArray, desc, SQL } from 'drizzle-orm';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';
import { UpdateAsignacionDto } from './dto/update-asignacion.dto';

@Injectable()
export class AsignacionesService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: {
    brigadistaId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];
    if (filters.brigadistaId)
      conditions.push(eq(asignacion.brigadistaId, filters.brigadistaId));
    const where = conditions.filter(Boolean).length
      ? and(...conditions.filter(Boolean))
      : undefined;

    const [countResult, data] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(asignacion)
        .where(where),
      this.db
        .select({
          asignacion,
          contrato,
          distrito,
        })
        .from(asignacion)
        .innerJoin(contrato, eq(asignacion.contratoId, contrato.id))
        .innerJoin(distrito, eq(contrato.distritoId, distrito.id))
        .where(where)
        .orderBy(desc(asignacion.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return { data, total: countResult[0].count };
  }

  async findByBrigadista(brigadistaId: string) {
    return this.db
      .select({
        asignacion,
        contrato,
        distrito,
      })
      .from(asignacion)
      .innerJoin(contrato, eq(asignacion.contratoId, contrato.id))
      .innerJoin(distrito, eq(contrato.distritoId, distrito.id))
      .where(eq(asignacion.brigadistaId, brigadistaId))
      .orderBy(desc(asignacion.createdAt));
  }

  async getAssignedContractIds(brigadistaId: string): Promise<string[]> {
    const rows = await this.db
      .select({ contratoId: asignacion.contratoId })
      .from(asignacion)
      .where(eq(asignacion.brigadistaId, brigadistaId));
    return rows.map((r) => r.contratoId);
  }

  async isContractAssigned(brigadistaId: string, contratoId: string) {
    const [row] = await this.db
      .select()
      .from(asignacion)
      .where(
        and(
          eq(asignacion.brigadistaId, brigadistaId),
          eq(asignacion.contratoId, contratoId),
        ),
      );
    return !!row;
  }

  async create(dto: CreateAsignacionDto) {
    const [brigadista] = await this.db
      .select()
      .from(user)
      .where(
        and(
          eq(user.id, dto.brigadistaId),
          eq(user.role, 'brigadista' as (typeof roleEnum.enumValues)[number]),
        ),
      );

    if (!brigadista) {
      throw new NotFoundException(
        `Brigadista con id ${dto.brigadistaId} no encontrado`,
      );
    }

    const existing = await this.db
      .select({ contratoId: asignacion.contratoId })
      .from(asignacion)
      .where(eq(asignacion.brigadistaId, dto.brigadistaId));

    const existingIds = new Set(existing.map((e) => e.contratoId));
    const newIds = dto.contratoIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      return [];
    }

    const validContratos = await this.db
      .select({ id: contrato.id })
      .from(contrato)
      .where(inArray(contrato.id, newIds));

    const validIds = new Set(validContratos.map((c) => c.id));

    const toInsert = newIds.filter((id) => validIds.has(id));

    if (toInsert.length === 0) {
      return [];
    }

    return this.db
      .insert(asignacion)
      .values(
        toInsert.map((contratoId) => ({
          brigadistaId: dto.brigadistaId,
          contratoId,
        })),
      )
      .returning();
  }

  async replace(brigadistaId: string, dto: UpdateAsignacionDto) {
    const [brigadista] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, brigadistaId));

    if (!brigadista) {
      throw new NotFoundException(
        `Brigadista con id ${brigadistaId} no encontrado`,
      );
    }

    const validContratos = await this.db
      .select({ id: contrato.id })
      .from(contrato)
      .where(inArray(contrato.id, dto.contratoIds));

    const validIds = validContratos.map((c) => c.id);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(asignacion)
        .where(eq(asignacion.brigadistaId, brigadistaId));

      if (validIds.length > 0) {
        await tx.insert(asignacion).values(
          validIds.map((contratoId) => ({
            brigadistaId,
            contratoId,
          })),
        );
      }
    });

    return this.findByBrigadista(brigadistaId);
  }

  async remove(id: string) {
    const [existing] = await this.db
      .select()
      .from(asignacion)
      .where(eq(asignacion.id, id));

    if (!existing) {
      throw new NotFoundException(`Asignación con id ${id} no encontrada`);
    }

    const [deleted] = await this.db
      .delete(asignacion)
      .where(eq(asignacion.id, id))
      .returning();

    return deleted;
  }
}

import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SQL, eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { DB_PROVIDER, type Database } from '../db/connection';
import {
  asignacion,
  corte,
  contrato,
  contratoEstadoEnum,
  predio,
} from '../db/schema';

@Injectable()
export class CortesService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: {
    distritoId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: (SQL | undefined)[] = [];

    if (filters.distritoId) {
      conditions.push(eq(predio.distritoId, filters.distritoId));
    }

    if (filters.fechaInicio) {
      conditions.push(gte(corte.fechaCorte, new Date(filters.fechaInicio)));
    }

    if (filters.fechaFin) {
      conditions.push(lte(corte.fechaCorte, new Date(filters.fechaFin)));
    }

    const whereClause =
      conditions.filter(Boolean).length > 0
        ? and(...conditions.filter(Boolean))
        : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(corte)
      .innerJoin(contrato, eq(corte.contratoId, contrato.id))
      .innerJoin(predio, eq(contrato.predioId, predio.id))
      .where(whereClause);

    const total = countResult.count;

    const data = await this.db
      .select()
      .from(corte)
      .innerJoin(contrato, eq(corte.contratoId, contrato.id))
      .innerJoin(predio, eq(contrato.predioId, predio.id))
      .where(whereClause)
      .orderBy(desc(corte.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total };
  }

  async findOne(id: string) {
    const [result] = await this.db.select().from(corte).where(eq(corte.id, id));
    if (!result) {
      throw new NotFoundException(`Corte con id ${id} no encontrado`);
    }
    return result;
  }

  async create(
    brigadistaId: string,
    dto: {
      contratoId: string;
      motivo: string;
      latitud?: string;
      longitud?: string;
    },
    fotoUrl?: string,
  ) {
    const [contratoFound] = await this.db
      .select()
      .from(contrato)
      .where(eq(contrato.id, dto.contratoId));
    if (!contratoFound) {
      throw new NotFoundException(
        `Contrato con id ${dto.contratoId} no encontrado`,
      );
    }

    const isAssigned = await this.db
      .select({ id: asignacion.id })
      .from(asignacion)
      .where(
        and(
          eq(asignacion.brigadistaId, brigadistaId),
          eq(asignacion.contratoId, dto.contratoId),
        ),
      )
      .limit(1);

    if (isAssigned.length === 0) {
      throw new ForbiddenException(
        'No tienes permiso para registrar cortes en este contrato. El contrato no está asignado a tu ruta.',
      );
    }

    let corteCreado: typeof corte.$inferSelect | undefined;

    await this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(corte)
        .values({
          contratoId: dto.contratoId,
          brigadistaId,
          motivo: dto.motivo,
          fotoUrl,
          latitud: dto.latitud,
          longitud: dto.longitud,
        })
        .returning();
      corteCreado = inserted;

      await tx
        .update(contrato)
        .set({
          estado: 'cortado' as (typeof contratoEstadoEnum.enumValues)[number],
        })
        .where(eq(contrato.id, dto.contratoId));
    });

    return corteCreado!;
  }
}

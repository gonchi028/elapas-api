import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import {
  asignacion,
  contrato,
  distrito,
  lectura,
  medidor,
  predio,
} from '../db/schema';
import { SQL, eq, and, sql, desc, gte, lte, inArray } from 'drizzle-orm';
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

  async findMiRuta(brigadistaId: string) {
    const asignaciones = await this.db
      .select({ contratoId: asignacion.contratoId })
      .from(asignacion)
      .where(eq(asignacion.brigadistaId, brigadistaId));

    if (asignaciones.length === 0) {
      return [];
    }

    const contratoIds = asignaciones.map((a) => a.contratoId);

    const contratosWithDetails = await this.db
      .select({
        contrato,
        distrito,
        predio,
        medidor,
      })
      .from(contrato)
      .innerJoin(predio, eq(contrato.predioId, predio.id))
      .innerJoin(distrito, eq(predio.distritoId, distrito.id))
      .innerJoin(medidor, eq(contrato.medidorId, medidor.id))
      .where(inArray(contrato.id, contratoIds));

    const currentPeriod = this.getCurrentPeriod();

    const lecturasDelPeriodo = await this.db
      .select({ contratoId: lectura.contratoId })
      .from(lectura)
      .where(
        and(
          inArray(lectura.contratoId, contratoIds),
          sql`to_char(${lectura.fechaLectura}, 'YYYY-MM') = ${currentPeriod}`,
        ),
      );

    const leidoSet = new Set(lecturasDelPeriodo.map((l) => l.contratoId));

    const ultimasLecturas = await this.db
      .select({
        contratoId: lectura.contratoId,
        valorLectura: lectura.valorLectura,
      })
      .from(lectura)
      .where(inArray(lectura.contratoId, contratoIds))
      .orderBy(desc(lectura.fechaLectura));

    const lastLecturaMap = new Map<string, number>();
    for (const l of ultimasLecturas) {
      if (!lastLecturaMap.has(l.contratoId)) {
        lastLecturaMap.set(l.contratoId, l.valorLectura);
      }
    }

    return contratosWithDetails.map((row) => ({
      contrato: row.contrato,
      distrito: row.distrito,
      predio: row.predio,
      medidor: row.medidor,
      estadoLectura: leidoSet.has(row.contrato.id)
        ? ('leido' as const)
        : ('pendiente' as const),
      ultimaLectura: lastLecturaMap.get(row.contrato.id) ?? null,
    }));
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  async create(brigadistaId: string, dto: CreateLecturaDto) {
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
        'No tienes permiso para registrar lecturas en este contrato. El contrato no está asignado a tu ruta.',
      );
    }

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

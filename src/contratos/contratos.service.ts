import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { contrato } from '../db/schema';
import { SQL, eq, and, sql, desc } from 'drizzle-orm';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

@Injectable()
export class ContratosService {
  async findAll(distritoId?: string, estado?: string, page = 1, limit = 20) {
    const conditions: SQL[] = [];

    if (distritoId) {
      conditions.push(eq(contrato.distritoId, distritoId));
    }

    if (estado) {
      conditions.push(eq(contrato.estado, estado as any));
    }

    const offset = (page - 1) * limit;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contrato)
      .where(whereClause);

    const total = countResult.count;

    const data = await db
      .select()
      .from(contrato)
      .where(whereClause)
      .orderBy(desc(contrato.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: { page, limit, total },
    };
  }

  async findOne(id: string) {
    const [result] = await db
      .select()
      .from(contrato)
      .where(eq(contrato.id, id));

    if (!result) {
      throw new NotFoundException(`Contrato con id ${id} no encontrado`);
    }

    return result;
  }

  async findByUsuario(usuarioId: string) {
    const data = await db
      .select()
      .from(contrato)
      .where(eq(contrato.usuarioId, usuarioId))
      .orderBy(desc(contrato.createdAt));

    return data;
  }

  async create(dto: CreateContratoDto) {
    const [result] = await db
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

    const values: Record<string, any> = {};

    if (dto.nroContrato !== undefined) values.nroContrato = dto.nroContrato;
    if (dto.usuarioId !== undefined) values.usuarioId = dto.usuarioId;
    if (dto.distritoId !== undefined) values.distritoId = dto.distritoId;
    if (dto.direccion !== undefined) values.direccion = dto.direccion;
    if (dto.nroMedidor !== undefined) values.nroMedidor = dto.nroMedidor;
    if (dto.latitud !== undefined) values.latitud = dto.latitud;
    if (dto.longitud !== undefined) values.longitud = dto.longitud;
    if (dto.estado !== undefined) values.estado = dto.estado;

    const [result] = await db
      .update(contrato)
      .set(values)
      .where(eq(contrato.id, id))
      .returning();

    return result;
  }
}

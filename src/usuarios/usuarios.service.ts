import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { user } from '../db/schema';
import { auth } from '../auth/auth';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  async findAll(role?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const conditions = [eq(user.estado, true)];
    if (role) {
      conditions.push(
        eq(user.role, role as 'admin' | 'brigadista' | 'ciudadano'),
      );
    }

    const whereClause = and(...conditions);

    const [data, countResult] = await Promise.all([
      db.select().from(user).where(whereClause).limit(limit).offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(whereClause),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total: Number(countResult[0].count),
      },
    };
  }

  async findOne(id: string) {
    const result = await db
      .select()
      .from(user)
      .where(and(eq(user.id, id), eq(user.estado, true)));

    if (!result.length) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return result[0];
  }

  async create(dto: CreateUsuarioDto) {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, dto.email));

    if (existing.length) {
      throw new ConflictException('El email ya está registrado');
    }

    const result = await auth.api.signUpEmail({
      body: {
        name: dto.nombre,
        email: dto.email,
        password: dto.password,
      },
    });

    if (result.user) {
      await db
        .update(user)
        .set({ role: dto.role as 'admin' | 'brigadista' | 'ciudadano' })
        .where(eq(user.id, result.user.id));
    }

    const [created] = await db
      .select()
      .from(user)
      .where(eq(user.email, dto.email));

    return created;
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    const values: Record<string, unknown> = {};
    if (dto.nombre !== undefined) values.name = dto.nombre;
    if (dto.email !== undefined) values.email = dto.email;
    if (dto.role !== undefined)
      values.role = dto.role as 'admin' | 'brigadista' | 'ciudadano';
    if (dto.estado !== undefined) values.estado = dto.estado;

    const [updated] = await db
      .update(user)
      .set(values)
      .where(eq(user.id, id))
      .returning();

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    const [deleted] = await db
      .update(user)
      .set({ estado: false })
      .where(eq(user.id, id))
      .returning();

    return deleted;
  }
}

import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DB_PROVIDER, type Database } from '../db/connection';
import { user, roleEnum } from '../db/schema';
import { auth } from '../auth/auth';

@Injectable()
export class UsuariosService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(role?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const conditions = [eq(user.estado, true)];
    if (role) {
      conditions.push(
        eq(user.role, role as (typeof roleEnum.enumValues)[number]),
      );
    }

    const whereClause = and(...conditions);

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(user)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(whereClause),
    ]);

    return {
      data,
      total: Number(countResult[0].count),
    };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(user)
      .where(and(eq(user.id, id), eq(user.estado, true)));
    if (!result) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return result;
  }

  async create(dto: {
    nombre: string;
    email: string;
    password: string;
    role: string;
  }) {
    const [existing] = await this.db
      .select()
      .from(user)
      .where(eq(user.email, dto.email));
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const result = await auth.api.signUpEmail({
      body: {
        name: dto.nombre,
        email: dto.email,
        password: dto.password,
      },
    });

    if (!result.user) {
      throw new ConflictException('Error al crear usuario');
    }

    const userId = result.user.id;

    await this.db
      .update(user)
      .set({ role: dto.role as (typeof roleEnum.enumValues)[number] })
      .where(eq(user.id, userId));

    const [created] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId));
    return created;
  }

  async update(
    id: string,
    dto: { nombre?: string; email?: string; role?: string; estado?: boolean },
  ) {
    await this.findOne(id);

    const values: Partial<{
      name: string;
      email: string;
      role: (typeof roleEnum.enumValues)[number];
      estado: boolean;
    }> = {};

    if (dto.nombre !== undefined) values.name = dto.nombre;
    if (dto.email !== undefined) values.email = dto.email;
    if (dto.role !== undefined)
      values.role = dto.role as (typeof roleEnum.enumValues)[number];
    if (dto.estado !== undefined) values.estado = dto.estado;

    const [updated] = await this.db
      .update(user)
      .set(values)
      .where(eq(user.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    const [deleted] = await this.db
      .update(user)
      .set({ estado: false })
      .where(eq(user.id, id))
      .returning();
    return deleted;
  }
}

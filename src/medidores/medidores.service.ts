import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DB_PROVIDER, type Database } from '../db/connection';
import { medidor, contrato } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { CreateMedidorDto } from './dto/create-medidor.dto';
import { UpdateMedidorDto } from './dto/update-medidor.dto';

@Injectable()
export class MedidoresService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll(filters: { page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const [countResult, data] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(medidor),
      this.db
        .select()
        .from(medidor)
        .orderBy(desc(medidor.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return { data, total: countResult[0].count };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(medidor)
      .where(eq(medidor.id, id));

    if (!result) {
      throw new NotFoundException(`Medidor con id ${id} no encontrado`);
    }

    return result;
  }

  async create(dto: CreateMedidorDto) {
    const [result] = await this.db
      .insert(medidor)
      .values({
        nroMedidor: dto.nroMedidor,
        contratoId: dto.contratoId,
      })
      .returning();

    return result;
  }

  async update(id: string, dto: UpdateMedidorDto) {
    await this.findOne(id);

    const values: Partial<typeof medidor.$inferInsert> = {};

    if (dto.nroMedidor !== undefined) values.nroMedidor = dto.nroMedidor;
    if (dto.contratoId !== undefined) values.contratoId = dto.contratoId;

    const [result] = await this.db
      .update(medidor)
      .set(values)
      .where(eq(medidor.id, id))
      .returning();

    return result;
  }

  async remove(id: string) {
    await this.findOne(id);

    const [linked] = await this.db
      .select({ id: contrato.id })
      .from(contrato)
      .where(eq(contrato.medidorId, id))
      .limit(1);

    if (linked) {
      throw new BadRequestException(
        'No se puede eliminar el medidor porque tiene un contrato asociado',
      );
    }

    const [deleted] = await this.db
      .delete(medidor)
      .where(eq(medidor.id, id))
      .returning();

    return deleted;
  }
}

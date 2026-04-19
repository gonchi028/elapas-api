import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { distrito } from '../db/schema';
import { CreateDistritoDto } from './dto/create-distrito.dto';
import { UpdateDistritoDto } from './dto/update-distrito.dto';

@Injectable()
export class DistritosService {
  async findAll() {
    const data = await db.select().from(distrito);
    return { success: true, data };
  }

  async findOne(id: string) {
    const [found] = await db.select().from(distrito).where(eq(distrito.id, id));
    if (!found) {
      throw new NotFoundException(`Distrito with id ${id} not found`);
    }
    return { success: true, data: found };
  }

  async create(dto: CreateDistritoDto) {
    const [created] = await db.insert(distrito).values(dto).returning();
    return { success: true, data: created };
  }

  async update(id: string, dto: UpdateDistritoDto) {
    const [found] = await db.select().from(distrito).where(eq(distrito.id, id));
    if (!found) {
      throw new NotFoundException(`Distrito with id ${id} not found`);
    }
    const [updated] = await db
      .update(distrito)
      .set(dto)
      .where(eq(distrito.id, id))
      .returning();
    return { success: true, data: updated };
  }

  async remove(id: string) {
    const [found] = await db.select().from(distrito).where(eq(distrito.id, id));
    if (!found) {
      throw new NotFoundException(`Distrito with id ${id} not found`);
    }
    await db.delete(distrito).where(eq(distrito.id, id));
    return { success: true };
  }
}

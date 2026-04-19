import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_PROVIDER, type Database } from '../db/connection';
import { distrito } from '../db/schema';

@Injectable()
export class DistritosService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll() {
    return this.db.select().from(distrito);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(distrito)
      .where(eq(distrito.id, id));
    if (!found) {
      throw new NotFoundException(`Distrito with id ${id} not found`);
    }
    return found;
  }

  async create(dto: { nombre: string; codigo: string }) {
    const [existing] = await this.db
      .select()
      .from(distrito)
      .where(eq(distrito.codigo, dto.codigo));
    if (existing) {
      throw new ConflictException(
        `Distrito with codigo ${dto.codigo} already exists`,
      );
    }
    const [created] = await this.db.insert(distrito).values(dto).returning();
    return created;
  }

  async update(id: string, dto: { nombre?: string; codigo?: string }) {
    const [found] = await this.db
      .select()
      .from(distrito)
      .where(eq(distrito.id, id));
    if (!found) {
      throw new NotFoundException(`Distrito with id ${id} not found`);
    }
    const [updated] = await this.db
      .update(distrito)
      .set(dto)
      .where(eq(distrito.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [found] = await this.db
      .select()
      .from(distrito)
      .where(eq(distrito.id, id));
    if (!found) {
      throw new NotFoundException(`Distrito with id ${id} not found`);
    }
    await this.db.delete(distrito).where(eq(distrito.id, id));
  }
}

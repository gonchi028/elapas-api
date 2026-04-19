import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_PROVIDER, type Database } from '../db/connection';
import { tarifa } from '../db/schema';

@Injectable()
export class TarifasService {
  constructor(@Inject(DB_PROVIDER) private db: Database) {}

  async findAll() {
    return this.db.select().from(tarifa).where(eq(tarifa.estado, true));
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(tarifa)
      .where(eq(tarifa.id, id));
    if (!result) {
      throw new NotFoundException(`Tarifa con id ${id} no encontrada`);
    }
    return result;
  }

  async create(dto: {
    nombre: string;
    tramoMin: number;
    tramoMax: number;
    precioM3: string;
    cargoFijo: string;
    estado?: boolean;
  }) {
    const [result] = await this.db
      .insert(tarifa)
      .values({
        nombre: dto.nombre,
        tramoMin: dto.tramoMin,
        tramoMax: dto.tramoMax,
        precioM3: dto.precioM3,
        cargoFijo: dto.cargoFijo,
        estado: dto.estado,
      })
      .returning();
    return result;
  }

  async update(
    id: string,
    dto: {
      nombre?: string;
      tramoMin?: number;
      tramoMax?: number;
      precioM3?: string;
      cargoFijo?: string;
      estado?: boolean;
    },
  ) {
    const [found] = await this.db
      .select()
      .from(tarifa)
      .where(eq(tarifa.id, id));
    if (!found) {
      throw new NotFoundException(`Tarifa con id ${id} no encontrada`);
    }

    const values: Partial<{
      nombre: string;
      tramoMin: number;
      tramoMax: number;
      precioM3: string;
      cargoFijo: string;
      estado: boolean;
    }> = {};

    if (dto.nombre !== undefined) values.nombre = dto.nombre;
    if (dto.tramoMin !== undefined) values.tramoMin = dto.tramoMin;
    if (dto.tramoMax !== undefined) values.tramoMax = dto.tramoMax;
    if (dto.precioM3 !== undefined) values.precioM3 = dto.precioM3;
    if (dto.cargoFijo !== undefined) values.cargoFijo = dto.cargoFijo;
    if (dto.estado !== undefined) values.estado = dto.estado;

    const [result] = await this.db
      .update(tarifa)
      .set(values)
      .where(eq(tarifa.id, id))
      .returning();
    return result;
  }
}

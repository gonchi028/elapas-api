import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { tarifa } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateTarifaDto } from './dto/create-tarifa.dto';

@Injectable()
export class TarifasService {
  async findAll() {
    const data = await db.select().from(tarifa).where(eq(tarifa.estado, true));

    return data;
  }

  async findOne(id: string) {
    const [result] = await db.select().from(tarifa).where(eq(tarifa.id, id));

    if (!result) {
      throw new NotFoundException(`Tarifa con id ${id} no encontrada`);
    }

    return result;
  }

  async create(dto: CreateTarifaDto) {
    const [result] = await db
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

  async update(id: string, dto: CreateTarifaDto) {
    await this.findOne(id);

    const values: Record<string, any> = {};

    if (dto.nombre !== undefined) values.nombre = dto.nombre;
    if (dto.tramoMin !== undefined) values.tramoMin = dto.tramoMin;
    if (dto.tramoMax !== undefined) values.tramoMax = dto.tramoMax;
    if (dto.precioM3 !== undefined) values.precioM3 = dto.precioM3;
    if (dto.cargoFijo !== undefined) values.cargoFijo = dto.cargoFijo;
    if (dto.estado !== undefined) values.estado = dto.estado;

    const [result] = await db
      .update(tarifa)
      .set(values)
      .where(eq(tarifa.id, id))
      .returning();

    return result;
  }
}

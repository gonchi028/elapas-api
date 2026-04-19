import 'dotenv/config';
import { db } from '../src/db/connection';
import {
  user,
  account,
  distrito,
  contrato,
  tarifa,
  lectura,
  factura,
  pago,
  corte,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

const uid = () => crypto.randomUUID();

async function clean() {
  console.log('Limpiando datos existentes...');
  await db.delete(pago);
  await db.delete(corte);
  await db.delete(factura);
  await db.delete(lectura);
  await db.delete(contrato);
  await db.delete(tarifa);
  await db.delete(distrito);
  await db.delete(account);
  await db.delete(user);
  console.log('Datos eliminados.');
}

async function seedDistritos() {
  console.log('Creando distritos...');
  const data = await db
    .insert(distrito)
    .values([
      { id: uid(), nombre: 'Distrito 1 - Central', codigo: 'D1' },
      { id: uid(), nombre: 'Distrito 2 - Norte', codigo: 'D2' },
      { id: uid(), nombre: 'Distrito 3 - Sur', codigo: 'D3' },
      { id: uid(), nombre: 'Distrito 4 - Este', codigo: 'D4' },
      { id: uid(), nombre: 'Distrito 5 - Oeste', codigo: 'D5' },
    ])
    .returning();
  console.log(`  ${data.length} distritos creados`);
  return data;
}

async function seedTarifas() {
  console.log('Creando tarifas...');
  const data = await db
    .insert(tarifa)
    .values([
      {
        id: uid(),
        nombre: 'Residencial Básico',
        tramoMin: 0,
        tramoMax: 10,
        precioM3: '3.50',
        cargoFijo: '10.00',
      },
      {
        id: uid(),
        nombre: 'Residencial Medio',
        tramoMin: 11,
        tramoMax: 20,
        precioM3: '5.00',
        cargoFijo: '10.00',
      },
      {
        id: uid(),
        nombre: 'Residencial Alto',
        tramoMin: 21,
        tramoMax: 30,
        precioM3: '7.50',
        cargoFijo: '10.00',
      },
      {
        id: uid(),
        nombre: 'Residencial Excedente',
        tramoMin: 31,
        tramoMax: 9999,
        precioM3: '10.00',
        cargoFijo: '10.00',
      },
    ])
    .returning();
  console.log(`  ${data.length} tarifas creadas`);
  return data;
}

async function seedUsers() {
  console.log('Creando usuarios y cuentas...');
  const hashedPassword = await hash('password123', 10);

  const usersData = [
    {
      name: 'Carlos Mendoza',
      email: 'admin@elapas.com',
      role: 'admin' as const,
    },
    {
      name: 'María Quispe',
      email: 'brigadista1@elapas.com',
      role: 'brigadista' as const,
    },
    {
      name: 'Juan Pérez',
      email: 'brigadista2@elapas.com',
      role: 'brigadista' as const,
    },
    {
      name: 'Ana Flores',
      email: 'brigadista3@elapas.com',
      role: 'brigadista' as const,
    },
    {
      name: 'Roberto Guzmán',
      email: 'ciudadano1@elapas.com',
      role: 'ciudadano' as const,
    },
    {
      name: 'Lucía Romero',
      email: 'ciudadano2@elapas.com',
      role: 'ciudadano' as const,
    },
    {
      name: 'Pedro Villca',
      email: 'ciudadano3@elapas.com',
      role: 'ciudadano' as const,
    },
    {
      name: 'Carmen Tapia',
      email: 'ciudadano4@elapas.com',
      role: 'ciudadano' as const,
    },
    {
      name: 'Fernando Rojas',
      email: 'ciudadano5@elapas.com',
      role: 'ciudadano' as const,
    },
  ];

  const created = await db
    .insert(user)
    .values(
      usersData.map((u) => ({
        id: uid(),
        name: u.name,
        email: u.email,
        role: u.role,
        estado: true,
        emailVerified: u.role !== 'ciudadano',
      })),
    )
    .returning();

  await db.insert(account).values(
    created.map((u) => ({
      id: uid(),
      accountId: u.email,
      providerId: 'credential',
      userId: u.id,
      password: hashedPassword,
    })),
  );

  console.log(`  ${created.length} usuarios creados (contraseña: password123)`);
  return created;
}

async function seedContratos(
  users: (typeof user.$inferSelect)[],
  distritos: (typeof distrito.$inferSelect)[],
) {
  console.log('Creando contratos...');
  const ciudadanos = users.filter((u) => u.role === 'ciudadano');

  const templates = [
    {
      ciudadano: 0,
      distrito: 0,
      dir: 'Calle Sucre #123',
      med: 'MED-0001',
      lat: '-19.0461000',
      lon: '-65.2595000',
    },
    {
      ciudadano: 0,
      distrito: 1,
      dir: 'Av. Grau #456',
      med: 'MED-0002',
      lat: '-19.0350000',
      lon: '-65.2480000',
    },
    {
      ciudadano: 1,
      distrito: 0,
      dir: 'Calle Bolívar #789',
      med: 'MED-0003',
      lat: '-19.0420000',
      lon: '-65.2620000',
    },
    {
      ciudadano: 1,
      distrito: 2,
      dir: 'Calle Arenales #321',
      med: 'MED-0004',
      lat: '-19.0580000',
      lon: '-65.2550000',
    },
    {
      ciudadano: 2,
      distrito: 1,
      dir: 'Av. Jaime Mendoza #654',
      med: 'MED-0005',
      lat: '-19.0320000',
      lon: '-65.2450000',
    },
    {
      ciudadano: 2,
      distrito: 3,
      dir: 'Calle Loa #987',
      med: 'MED-0006',
      lat: '-19.0400000',
      lon: '-65.2300000',
    },
    {
      ciudadano: 3,
      distrito: 0,
      dir: 'Av. Hernando Sanabria #147',
      med: 'MED-0007',
      lat: '-19.0480000',
      lon: '-65.2610000',
    },
    {
      ciudadano: 3,
      distrito: 4,
      dir: 'Calle Pérez de Holguín #258',
      med: 'MED-0008',
      lat: '-19.0500000',
      lon: '-65.2750000',
    },
    {
      ciudadano: 4,
      distrito: 2,
      dir: 'Av. German Busch #369',
      med: 'MED-0009',
      lat: '-19.0600000',
      lon: '-65.2500000',
    },
    {
      ciudadano: 4,
      distrito: 3,
      dir: 'Calle Chuquisaca #741',
      med: 'MED-0010',
      lat: '-19.0380000',
      lon: '-65.2350000',
    },
  ];

  const data = await db
    .insert(contrato)
    .values(
      templates.map((t, i) => ({
        id: uid(),
        nroContrato: `CNT-${String(i + 1).padStart(3, '0')}`,
        usuarioId: ciudadanos[t.ciudadano].id,
        distritoId: distritos[t.distrito].id,
        direccion: t.dir,
        nroMedidor: t.med,
        latitud: t.lat,
        longitud: t.lon,
        estado: 'activo' as const,
      })),
    )
    .returning();

  console.log(`  ${data.length} contratos creados`);
  return data;
}

async function seedLecturas(
  contratos: (typeof contrato.$inferSelect)[],
  users: (typeof user.$inferSelect)[],
) {
  console.log('Creando lecturas...');
  const brigadistas = users.filter((u) => u.role === 'brigadista');
  const baseValues = [1200, 980, 1500, 750, 1100, 2000, 890, 1300, 1050, 1600];
  const all: (typeof lectura.$inferSelect)[] = [];

  for (let i = 0; i < contratos.length; i++) {
    const c = contratos[i];
    const brig = brigadistas[i % brigadistas.length];
    const base = baseValues[i];
    const consumo = 5 + Math.floor(Math.random() * 30);

    const fechaAnterior = new Date('2026-03-15T10:00:00Z');
    const fechaActual = new Date('2026-04-15T10:00:00Z');

    const rows = await db
      .insert(lectura)
      .values([
        {
          id: uid(),
          contratoId: c.id,
          brigadistaId: brig.id,
          valorLectura: base,
          fechaLectura: fechaAnterior,
        },
        {
          id: uid(),
          contratoId: c.id,
          brigadistaId: brig.id,
          valorLectura: base + consumo,
          fechaLectura: fechaActual,
        },
      ])
      .returning();

    all.push(...rows);
  }

  console.log(`  ${all.length} lecturas creadas`);
  return all;
}

async function seedFacturas(
  contratos: (typeof contrato.$inferSelect)[],
  lecturas: (typeof lectura.$inferSelect)[],
  tarifas: (typeof tarifa.$inferSelect)[],
) {
  console.log('Creando facturas...');
  const data: (typeof factura.$inferSelect)[] = [];

  for (let i = 0; i < contratos.length; i++) {
    const c = contratos[i];
    const lects = lecturas.filter((l) => l.contratoId === c.id);
    if (lects.length < 2) continue;

    const consumoM3 = lects[1].valorLectura - lects[0].valorLectura;
    if (consumoM3 <= 0) continue;

    const t = tarifas.find(
      (t) =>
        consumoM3 >= (t.tramoMin ?? 0) && consumoM3 <= (t.tramoMax ?? Infinity),
    );
    if (!t) continue;

    const subtotal = consumoM3 * parseFloat(t.precioM3 ?? '0');
    const cargoFijo = parseFloat(t.cargoFijo ?? '0');
    const total = subtotal + cargoFijo;
    const estaPagada = i < 3;

    const [f] = await db
      .insert(factura)
      .values({
        id: uid(),
        contratoId: c.id,
        lecturaId: lects[1].id,
        periodo: '2026-04',
        consumoM3,
        tarifaId: t.id,
        cargoFijo: cargoFijo.toFixed(2),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        estado: estaPagada ? ('pagada' as const) : ('pendiente' as const),
        fechaVencimiento: '2026-05-15',
      })
      .returning();

    data.push(f);
  }

  console.log(`  ${data.length} facturas creadas`);
  return data;
}

async function seedPagos(facturas: (typeof factura.$inferSelect)[]) {
  console.log('Creando pagos...');
  const pagadas = facturas.filter((f) => f.estado === 'pagada');

  const data = await db
    .insert(pago)
    .values(
      pagadas.map((f, i) => ({
        id: uid(),
        facturaId: f.id,
        monto: f.total,
        metodoPago: 'qr_simple' as const,
        referencia: `REF-2026-${String(i + 1).padStart(4, '0')}`,
        fechaPago: new Date(
          `2026-04-${String(15 + i).padStart(2, '0')}T10:00:00Z`,
        ),
      })),
    )
    .returning();

  console.log(`  ${data.length} pagos creados`);
  return data;
}

async function seedCortes(
  contratos: (typeof contrato.$inferSelect)[],
  users: (typeof user.$inferSelect)[],
) {
  console.log('Creando cortes...');
  const brigadistas = users.filter((u) => u.role === 'brigadista');
  const target = contratos[contratos.length - 1];

  const [data] = await db
    .insert(corte)
    .values({
      id: uid(),
      contratoId: target.id,
      brigadistaId: brigadistas[0].id,
      motivo: 'Morosidad — 3 meses sin pago',
      fechaCorte: new Date('2026-04-17T09:30:00Z'),
      estado: 'efectuado' as const,
    })
    .returning();

  await db
    .update(contrato)
    .set({ estado: 'cortado' as const })
    .where(eq(contrato.id, target.id));

  console.log('  1 corte creado');
  return [data];
}

async function main() {
  console.log('🌱 Iniciando seed...\n');

  await clean();
  console.log('');

  const distritos = await seedDistritos();
  const tarifas = await seedTarifas();
  const users = await seedUsers();
  const contratos = await seedContratos(users, distritos);
  const lecturas = await seedLecturas(contratos, users);
  const facturas = await seedFacturas(contratos, lecturas, tarifas);
  const pagos = await seedPagos(facturas);
  const cortes = await seedCortes(contratos, users);

  console.log('\n✅ Seed completado:');
  console.log(`   ${distritos.length} distritos`);
  console.log(`   ${tarifas.length} tarifas`);
  console.log(`   ${users.length} usuarios`);
  console.log(`   ${contratos.length} contratos`);
  console.log(`   ${lecturas.length} lecturas`);
  console.log(`   ${facturas.length} facturas`);
  console.log(`   ${pagos.length} pagos`);
  console.log(`   ${cortes.length} cortes`);
  console.log('\n🔑 Credenciales:');
  console.log('   Admin:        admin@elapas.com / password123');
  console.log('   Brigadista 1: brigadista1@elapas.com / password123');
  console.log('   Brigadista 2: brigadista2@elapas.com / password123');
  console.log('   Brigadista 3: brigadista3@elapas.com / password123');
  console.log('   Ciudadano 1:  ciudadano1@elapas.com / password123');
  console.log('   Ciudadano 2:  ciudadano2@elapas.com / password123');
  console.log('   Ciudadano 3:  ciudadano3@elapas.com / password123');
  console.log('   Ciudadano 4:  ciudadano4@elapas.com / password123');
  console.log('   Ciudadano 5:  ciudadano5@elapas.com / password123');

  process.exit(0);
}

main().catch((e) => {
  console.error('Error en seed:', e);
  process.exit(1);
});

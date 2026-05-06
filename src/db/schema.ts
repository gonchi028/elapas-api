import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'brigadista', 'ciudadano']);

export const contratoEstadoEnum = pgEnum('contrato_estado', [
  'activo',
  'suspendido',
  'cortado',
]);

export const facturaEstadoEnum = pgEnum('factura_estado', [
  'pendiente',
  'pagada',
  'vencida',
]);

export const pagoMetodoEnum = pgEnum('pago_metodo', [
  'qr_simple',
  'efectivo',
  'transferencia',
]);

export const corteEstadoEnum = pgEnum('corte_estado', [
  'efectuado',
  'reconectado',
]);

export const user = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: roleEnum('role').default('ciudadano').notNull(),
  estado: boolean('estado').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  'session',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const distrito = pgTable('distrito', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nombre: text('nombre').notNull(),
  codigo: text('codigo').notNull().unique(),
});

export const predio = pgTable('predio', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  distritoId: text('distrito_id')
    .notNull()
    .references(() => distrito.id),
  direccion: text('direccion').notNull(),
  latitud: decimal('latitud', { precision: 10, scale: 7 }),
  longitud: decimal('longitud', { precision: 10, scale: 7 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contrato = pgTable('contrato', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nroContrato: text('nro_contrato').notNull().unique(),
  usuarioId: text('usuario_id')
    .notNull()
    .references(() => user.id),
  predioId: text('predio_id')
    .notNull()
    .references(() => predio.id),
  medidorId: text('medidor_id')
    .notNull()
    .references(() => medidor.id),
  estado: contratoEstadoEnum('estado').default('activo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const medidor = pgTable('medidor', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nroMedidor: text('nro_medidor').notNull().unique(),
  contratoId: text('contrato_id')
    .notNull()
    .references(() => contrato.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tarifa = pgTable('tarifa', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nombre: text('nombre').notNull(),
  tramoMin: integer('tramo_min').notNull(),
  tramoMax: integer('tramo_max').notNull(),
  precioM3: decimal('precio_m3', { precision: 10, scale: 2 }).notNull(),
  cargoFijo: decimal('cargo_fijo', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  estado: boolean('estado').default(true).notNull(),
});

export const lectura = pgTable('lectura', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contratoId: text('contrato_id')
    .notNull()
    .references(() => contrato.id),
  brigadistaId: text('brigadista_id')
    .notNull()
    .references(() => user.id),
  valorLectura: integer('valor_lectura').notNull(),
  fotoUrl: text('foto_url'),
  latitud: decimal('latitud', { precision: 10, scale: 7 }),
  longitud: decimal('longitud', { precision: 10, scale: 7 }),
  fechaLectura: timestamp('fecha_lectura').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const factura = pgTable('factura', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contratoId: text('contrato_id')
    .notNull()
    .references(() => contrato.id),
  lecturaId: text('lectura_id')
    .notNull()
    .references(() => lectura.id),
  periodo: text('periodo').notNull(),
  consumoM3: integer('consumo_m3').notNull(),
  tarifaId: text('tarifa_id')
    .notNull()
    .references(() => tarifa.id),
  cargoFijo: decimal('cargo_fijo', { precision: 10, scale: 2 }),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  estado: facturaEstadoEnum('estado').default('pendiente').notNull(),
  fechaVencimiento: date('fecha_vencimiento').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pago = pgTable('pago', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  facturaId: text('factura_id')
    .notNull()
    .references(() => factura.id),
  monto: decimal('monto', { precision: 10, scale: 2 }).notNull(),
  metodoPago: pagoMetodoEnum('metodo_pago').default('qr_simple').notNull(),
  referencia: text('referencia'),
  qrData: text('qr_data'),
  fechaPago: timestamp('fecha_pago').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const corte = pgTable('corte', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contratoId: text('contrato_id')
    .notNull()
    .references(() => contrato.id),
  brigadistaId: text('brigadista_id')
    .notNull()
    .references(() => user.id),
  motivo: text('motivo').notNull(),
  fotoUrl: text('foto_url'),
  latitud: decimal('latitud', { precision: 10, scale: 7 }),
  longitud: decimal('longitud', { precision: 10, scale: 7 }),
  fechaCorte: timestamp('fecha_corte').defaultNow().notNull(),
  estado: corteEstadoEnum('estado').default('efectuado').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const asignacion = pgTable(
  'asignacion',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    brigadistaId: text('brigadista_id')
      .notNull()
      .references(() => user.id),
    contratoId: text('contrato_id')
      .notNull()
      .references(() => contrato.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('asignacion_unique_idx').on(
      table.brigadistaId,
      table.contratoId,
    ),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  contratos: many(contrato),
  lecturas: many(lectura),
  cortes: many(corte),
  asignaciones: many(asignacion),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const distritoRelations = relations(distrito, ({ many }) => ({
  predios: many(predio),
}));

export const contratoRelations = relations(contrato, ({ one, many }) => ({
  usuario: one(user, {
    fields: [contrato.usuarioId],
    references: [user.id],
  }),
  predio: one(predio, {
    fields: [contrato.predioId],
    references: [predio.id],
  }),
  medidor: one(medidor, {
    fields: [contrato.medidorId],
    references: [medidor.id],
  }),
  lecturas: many(lectura),
  facturas: many(factura),
  cortes: many(corte),
  asignaciones: many(asignacion),
}));

export const predioRelations = relations(predio, ({ one, many }) => ({
  distrito: one(distrito, {
    fields: [predio.distritoId],
    references: [distrito.id],
  }),
  contratos: many(contrato),
}));

export const medidorRelations = relations(medidor, ({ one }) => ({
  contrato: one(contrato, {
    fields: [medidor.contratoId],
    references: [contrato.id],
  }),
}));

export const tarifaRelations = relations(tarifa, ({ many }) => ({
  facturas: many(factura),
}));

export const lecturaRelations = relations(lectura, ({ one }) => ({
  contrato: one(contrato, {
    fields: [lectura.contratoId],
    references: [contrato.id],
  }),
  brigadista: one(user, {
    fields: [lectura.brigadistaId],
    references: [user.id],
  }),
}));

export const facturaRelations = relations(factura, ({ one, many }) => ({
  contrato: one(contrato, {
    fields: [factura.contratoId],
    references: [contrato.id],
  }),
  lectura: one(lectura, {
    fields: [factura.lecturaId],
    references: [lectura.id],
  }),
  tarifa: one(tarifa, {
    fields: [factura.tarifaId],
    references: [tarifa.id],
  }),
  pagos: many(pago),
}));

export const pagoRelations = relations(pago, ({ one }) => ({
  factura: one(factura, {
    fields: [pago.facturaId],
    references: [factura.id],
  }),
}));

export const corteRelations = relations(corte, ({ one }) => ({
  contrato: one(contrato, {
    fields: [corte.contratoId],
    references: [contrato.id],
  }),
  brigadista: one(user, {
    fields: [corte.brigadistaId],
    references: [user.id],
  }),
}));

export const asignacionRelations = relations(asignacion, ({ one }) => ({
  brigadista: one(user, {
    fields: [asignacion.brigadistaId],
    references: [user.id],
  }),
  contrato: one(contrato, {
    fields: [asignacion.contratoId],
    references: [contrato.id],
  }),
}));

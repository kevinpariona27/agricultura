import db from './src/db/connection.js';
import bcrypt from 'bcrypt';

// Skip if already seeded (idempotent)
const [{ count: existingCount }] = await db('parcels').count('* as c');
if (Number(existingCount) > 0) {
  console.log('Data already exists — skipping seed.');
  await db.destroy();
  process.exit(0);
}

// Clean existing data (keep users)
console.log('Cleaning existing data...');
const tables = ['harvests', 'irrigations', 'fertilizations', 'pests', 'crops', 'inventory', 'parcels'];
for (const t of tables) {
  await db(t).del();
  console.log(`  Cleared ${t}`);
}

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

async function insert(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  await db(table).insert(rows);
  console.log(`  ${table}: ${rows.length} rows`);
}

console.log('\nSeeding...');

// Resolve user — prefer admin@agroexec.com, create if missing
let uid: number | undefined;
const adminRow = await db('users').select('id').where({ email: 'admin@agroexec.com' }).first();
if (adminRow) {
  uid = adminRow.id;
} else {
  const hash = bcrypt.hashSync('admin123456', 10);
  const [inserted] = await db('users').insert({ email: 'admin@agroexec.com', password_hash: hash }).returning('id');
  uid = typeof inserted === 'object' ? (inserted as { id: number }).id : inserted;
  console.log(`  Created admin user (id=${uid})`);
}

// ============================================================
// PARCELS — 7 parcels
// ============================================================
const parcels = [
  { user_id: uid, name: 'Lote Norte', area: 12.5, location: 'Sector Norte, coordenadas 34°S', soil_type: 'franco-arenoso', created_at: '2025-08-15 08:00:00', updated_at: '2025-08-15 08:00:00' },
  { user_id: uid, name: 'Lote Sur', area: 18.2, location: 'Sector Sur, lindero al arroyo', soil_type: 'franco-limoso', created_at: '2025-08-15 08:00:00', updated_at: '2025-08-15 08:00:00' },
  { user_id: uid, name: 'Lote Este', area: 9.8, location: 'Sector Este, zona alta', soil_type: 'franco', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
  { user_id: uid, name: 'Lote Oeste', area: 15.0, location: 'Sector Oeste, terreno ondulado', soil_type: 'arenoso', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
  { user_id: uid, name: 'Lote Central', area: 7.4, location: 'Centro del campo, cerca del casco', soil_type: 'franco-arcilloso', created_at: '2025-10-01 07:00:00', updated_at: '2025-10-01 07:00:00' },
  { user_id: uid, name: 'Lote La Esquina', area: 4.5, location: 'Esquina SE, media sombra', soil_type: 'franco', created_at: '2025-11-01 09:00:00', updated_at: '2025-11-01 09:00:00' },
  { user_id: uid, name: 'Lote Invernadero', area: 1.8, location: 'Cerca del casco, bajo cubierta', soil_type: 'tierra-negra', created_at: '2026-01-01 08:00:00', updated_at: '2026-01-01 08:00:00' },
];
await insert('parcels', parcels);

// ============================================================
// CROPS — multiple per parcel with different statuses
// ============================================================
const crops = [
  // Lote Norte (id=1) — Maíz
  { parcel_id: 1, variety: 'Maíz DK-747 VT3P', planting_date: '2025-10-15', status: 'cosechado', estimated_harvest_date: '2026-03-20', planting_density: 7.5, notes: 'Campaña 2025/26. Híbrido resistente a sequía.', created_at: '2025-10-15 06:00:00', updated_at: '2026-03-25 18:00:00' },
  { parcel_id: 1, variety: 'Maíz P2089 VYHR', planting_date: '2026-09-01', status: 'activo', estimated_harvest_date: '2027-02-15', planting_density: 8.0, notes: 'Campaña 2026/27. Siembra temprana.', created_at: '2026-09-01 07:00:00', updated_at: now() },

  // Lote Sur (id=2) — Soja
  { parcel_id: 2, variety: 'Soja DM 60i62 IPRO', planting_date: '2025-11-01', status: 'cosechado', estimated_harvest_date: '2026-04-10', planting_density: 35.0, notes: 'Soja de primera. Buen potencial.', created_at: '2025-11-01 07:00:00', updated_at: '2026-04-15 20:00:00' },
  { parcel_id: 2, variety: 'Soja NS 5028 IPRO', planting_date: '2026-11-15', status: 'planificado', estimated_harvest_date: '2027-04-20', planting_density: 38.0, notes: 'Planificada para siembra directa.', created_at: '2026-06-15 10:00:00', updated_at: now() },

  // Lote Este (id=3) — Trigo
  { parcel_id: 3, variety: 'Trigo Baguette 802', planting_date: '2026-06-20', status: 'activo', estimated_harvest_date: '2026-12-01', planting_density: 320.0, notes: 'Trigo pan. Buen macollaje.', created_at: '2026-06-20 06:00:00', updated_at: now() },
  { parcel_id: 3, variety: 'Trigo ACA 303 Plus', planting_date: '2025-06-15', status: 'cosechado', estimated_harvest_date: '2025-12-05', planting_density: 300.0, notes: 'Excelente calidad panadera.', created_at: '2025-06-15 06:00:00', updated_at: '2025-12-10 14:00:00' },

  // Lote Oeste (id=4) — Girasol
  { parcel_id: 4, variety: 'Girasol ACA 882 CL', planting_date: '2025-10-20', status: 'cosechado', estimated_harvest_date: '2026-03-01', planting_density: 5.5, notes: 'Alto oleico. Rendimiento récord.', created_at: '2025-10-20 07:00:00', updated_at: '2026-03-05 16:00:00' },
  { parcel_id: 4, variety: 'Girasol SYN 4070 CL', planting_date: '2026-10-01', status: 'activo', estimated_harvest_date: '2027-02-20', planting_density: 6.0, notes: 'Híbrido CL. Buena sanidad.', created_at: '2026-10-01 06:00:00', updated_at: now() },

  // Lote Central (id=5) — Cebada
  { parcel_id: 5, variety: 'Cebada Andreia', planting_date: '2026-07-01', status: 'activo', estimated_harvest_date: '2026-11-15', planting_density: 280.0, notes: 'Cebada cervecera. Contrato con maltería.', created_at: '2026-07-01 07:00:00', updated_at: now() },
  { parcel_id: 5, variety: 'Cebada Montoya', planting_date: '2025-07-10', status: 'cosechado', estimated_harvest_date: '2025-11-20', planting_density: 270.0, notes: 'Buena clasificación. Calibre >85%.', created_at: '2025-07-10 07:00:00', updated_at: '2025-11-25 12:00:00' },

  // Lote La Esquina (id=6) — Alfalfa
  { parcel_id: 6, variety: 'Alfalfa Monarca SP', planting_date: '2026-03-01', status: 'activo', estimated_harvest_date: '2026-10-15', planting_density: 25.0, notes: 'Perenne. 4 cortes por año.', created_at: '2026-03-01 07:00:00', updated_at: now() },
  { parcel_id: 6, variety: 'Alfalfa WL 656 HQ', planting_date: '2025-04-01', status: 'activo', estimated_harvest_date: '2026-05-01', planting_density: 25.0, notes: 'Segundo año. Excelente stand.', created_at: '2025-04-01 07:00:00', updated_at: now() },

  // Lote Invernadero (id=7) — Hortalizas
  { parcel_id: 7, variety: 'Tomate Platense', planting_date: '2026-01-15', status: 'cosechado', estimated_harvest_date: '2026-04-01', planting_density: 2.2, notes: 'Cultivo bajo invernadero. Riego por goteo.', created_at: '2026-01-15 08:00:00', updated_at: '2026-04-10 09:00:00' },
  { parcel_id: 7, variety: 'Lechuga Grand Rapids', planting_date: '2026-08-20', status: 'activo', estimated_harvest_date: '2026-10-15', planting_density: 12.0, notes: 'Hidroponia NFT. Ciclo corto.', created_at: '2026-08-20 06:00:00', updated_at: now() },
  { parcel_id: 7, variety: 'Pimiento California', planting_date: '2026-02-01', status: 'perdido', estimated_harvest_date: '2026-05-15', planting_density: 3.0, notes: 'Afectado por helada tardía. Se replantifica.', created_at: '2026-02-01 07:00:00', updated_at: '2026-04-01 08:00:00' },
];
await insert('crops', crops);

// ============================================================
// IRRIGATIONS
// ============================================================
const irrigations = [
  { crop_id: 1, amount: 28.0, irrigation_date: '2025-12-01', method: 'pivote-central', duration: 6.0, notes: 'Riego compensatorio post-siembra.', created_at: '2025-12-01 14:00:00', updated_at: '2025-12-01 14:00:00' },
  { crop_id: 1, amount: 25.0, irrigation_date: '2025-12-20', method: 'pivote-central', duration: 5.5, notes: 'Período crítico V6.', created_at: '2025-12-20 14:00:00', updated_at: '2025-12-20 14:00:00' },
  { crop_id: 1, amount: 32.0, irrigation_date: '2026-01-15', method: 'pivote-central', duration: 7.0, notes: 'Pre-floración. Alta demanda.', created_at: '2026-01-15 13:00:00', updated_at: '2026-01-15 13:00:00' },
  { crop_id: 1, amount: 30.0, irrigation_date: '2026-02-10', method: 'pivote-central', duration: 6.5, notes: 'Llenado de granos.', created_at: '2026-02-10 14:00:00', updated_at: '2026-02-10 14:00:00' },
  { crop_id: 2, amount: 22.0, irrigation_date: '2026-09-05', method: 'pivote-central', duration: 5.0, notes: 'Riego de emergencia.', created_at: '2026-09-05 15:00:00', updated_at: '2026-09-05 15:00:00' },
  { crop_id: 2, amount: 26.0, irrigation_date: '2026-09-25', method: 'pivote-central', duration: 5.5, notes: 'Desarrollo vegetativo.', created_at: '2026-09-25 14:00:00', updated_at: '2026-09-25 14:00:00' },
  { crop_id: 3, amount: 18.0, irrigation_date: '2025-12-15', method: 'aspersion', duration: 8.0, notes: 'Riego complementario.', created_at: '2025-12-15 06:00:00', updated_at: '2025-12-15 06:00:00' },
  { crop_id: 3, amount: 20.0, irrigation_date: '2026-01-20', method: 'aspersion', duration: 9.0, notes: 'Floración R1-R2.', created_at: '2026-01-20 06:00:00', updated_at: '2026-01-20 06:00:00' },
  { crop_id: 3, amount: 22.0, irrigation_date: '2026-02-25', method: 'aspersion', duration: 9.5, notes: 'Llenado de vainas.', created_at: '2026-02-25 06:00:00', updated_at: '2026-02-25 06:00:00' },
  { crop_id: 6, amount: 15.0, irrigation_date: '2025-08-10', method: 'goteo', duration: 12.0, notes: 'Macollaje. Baja demanda.', created_at: '2025-08-10 05:00:00', updated_at: '2025-08-10 05:00:00' },
  { crop_id: 6, amount: 20.0, irrigation_date: '2025-09-20', method: 'goteo', duration: 14.0, notes: 'Encañazón. Alta demanda.', created_at: '2025-09-20 05:00:00', updated_at: '2025-09-20 05:00:00' },
  { crop_id: 6, amount: 18.0, irrigation_date: '2025-10-25', method: 'goteo', duration: 13.0, notes: 'Llenado de granos.', created_at: '2025-10-25 05:00:00', updated_at: '2025-10-25 05:00:00' },
  { crop_id: 5, amount: 16.0, irrigation_date: '2026-07-15', method: 'goteo', duration: 11.0, notes: 'Etapa de macollaje.', created_at: '2026-07-15 06:00:00', updated_at: '2026-07-15 06:00:00' },
  { crop_id: 5, amount: 20.0, irrigation_date: '2026-08-20', method: 'goteo', duration: 12.5, notes: 'Pre-encanazón.', created_at: '2026-08-20 06:00:00', updated_at: '2026-08-20 06:00:00' },
  { crop_id: 7, amount: 14.0, irrigation_date: '2025-11-15', method: 'pivote-central', duration: 4.0, notes: 'Etapa vegetativa.', created_at: '2025-11-15 15:00:00', updated_at: '2025-11-15 15:00:00' },
  { crop_id: 7, amount: 18.0, irrigation_date: '2025-12-20', method: 'pivote-central', duration: 5.0, notes: 'Botón floral.', created_at: '2025-12-20 15:00:00', updated_at: '2025-12-20 15:00:00' },
  { crop_id: 7, amount: 22.0, irrigation_date: '2026-01-25', method: 'pivote-central', duration: 5.5, notes: 'Floración y llenado.', created_at: '2026-01-25 14:00:00', updated_at: '2026-01-25 14:00:00' },
  { crop_id: 8, amount: 15.0, irrigation_date: '2026-10-10', method: 'pivote-central', duration: 4.0, notes: 'Emergencia y V4.', created_at: '2026-10-10 15:00:00', updated_at: '2026-10-10 15:00:00' },
  { crop_id: 9, amount: 12.0, irrigation_date: '2026-07-20', method: 'aspersion', duration: 8.0, notes: 'Macollaje temprano.', created_at: '2026-07-20 05:00:00', updated_at: '2026-07-20 05:00:00' },
  { crop_id: 10, amount: 14.0, irrigation_date: '2025-08-05', method: 'aspersion', duration: 9.0, notes: 'Etapa vegetativa.', created_at: '2025-08-05 05:00:00', updated_at: '2025-08-05 05:00:00' },
  { crop_id: 10, amount: 17.0, irrigation_date: '2025-09-10', method: 'aspersion', duration: 10.0, notes: 'Pre-espigazón.', created_at: '2025-09-10 05:00:00', updated_at: '2025-09-10 05:00:00' },
  { crop_id: 11, amount: 8.0, irrigation_date: '2026-04-15', method: 'aspersion', duration: 4.0, notes: 'Primer corte.', created_at: '2026-04-15 06:00:00', updated_at: '2026-04-15 06:00:00' },
  { crop_id: 11, amount: 10.0, irrigation_date: '2026-06-10', method: 'aspersion', duration: 5.0, notes: 'Segundo corte.', created_at: '2026-06-10 06:00:00', updated_at: '2026-06-10 06:00:00' },
  { crop_id: 13, amount: 4.0, irrigation_date: '2026-01-20', method: 'goteo', duration: 2.0, notes: 'Riego diario en invernadero.', created_at: '2026-01-20 08:00:00', updated_at: '2026-01-20 08:00:00' },
  { crop_id: 13, amount: 5.0, irrigation_date: '2026-02-15', method: 'goteo', duration: 2.5, notes: 'Floración. Mayor frecuencia.', created_at: '2026-02-15 08:00:00', updated_at: '2026-02-15 08:00:00' },
  { crop_id: 13, amount: 6.0, irrigation_date: '2026-03-10', method: 'goteo', duration: 3.0, notes: 'Fructificación.', created_at: '2026-03-10 08:00:00', updated_at: '2026-03-10 08:00:00' },
  { crop_id: 14, amount: 2.0, irrigation_date: '2026-08-25', method: 'goteo', duration: 1.5, notes: 'NFT recirculante. Solución nutritiva.', created_at: '2026-08-25 08:00:00', updated_at: '2026-08-25 08:00:00' },
  { crop_id: 14, amount: 2.5, irrigation_date: '2026-09-05', method: 'goteo', duration: 2.0, notes: 'Crecimiento activo.', created_at: '2026-09-05 08:00:00', updated_at: '2026-09-05 08:00:00' },
  { crop_id: 12, amount: 10.0, irrigation_date: '2026-05-01', method: 'aspersion', duration: 4.5, notes: 'Rebrote post-corte.', created_at: '2026-05-01 06:00:00', updated_at: '2026-05-01 06:00:00' },
];
await insert('irrigations', irrigations);

// ============================================================
// FERTILIZATIONS
// ============================================================
const fertilizations = [
  { crop_id: 1, producto: 'Urea (46-0-0)', dosis: 200.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-01', notas: 'Aplicación en V4.', costo: 95000, created_at: '2025-11-01 10:00:00', updated_at: '2025-11-01 10:00:00' },
  { crop_id: 1, producto: 'Fosfato Diamónico (18-46-0)', dosis: 120.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-15', notas: 'A la siembra.', costo: 85000, created_at: '2025-10-15 10:00:00', updated_at: '2025-10-15 10:00:00' },
  { crop_id: 1, producto: 'Nitrato de Amonio', dosis: 150.0, unidad: 'kg/ha', fecha_aplicacion: '2026-01-05', notas: 'Refertilización en V10.', costo: 68000, created_at: '2026-01-05 10:00:00', updated_at: '2026-01-05 10:00:00' },
  { crop_id: 2, producto: 'Fosfato Monoamónico (11-52-0)', dosis: 130.0, unidad: 'kg/ha', fecha_aplicacion: '2026-09-01', notas: 'Arrancador a la siembra.', costo: 92000, created_at: '2026-09-01 09:00:00', updated_at: '2026-09-01 09:00:00' },
  { crop_id: 2, producto: 'Urea (46-0-0)', dosis: 180.0, unidad: 'kg/ha', fecha_aplicacion: '2026-09-25', notas: 'Aplicación en V6.', costo: 86000, created_at: '2026-09-25 09:00:00', updated_at: '2026-09-25 09:00:00' },
  { crop_id: 3, producto: 'Superfosfato Simple', dosis: 150.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-01', notas: 'Fósforo a la siembra.', costo: 45000, created_at: '2025-11-01 08:00:00', updated_at: '2025-11-01 08:00:00' },
  { crop_id: 3, producto: 'Sulfato de Potasio', dosis: 100.0, unidad: 'kg/ha', fecha_aplicacion: '2026-01-01', notas: 'Potasio en floración.', costo: 72000, created_at: '2026-01-01 08:00:00', updated_at: '2026-01-01 08:00:00' },
  { crop_id: 3, producto: 'Inoculante Bradyrhizobium', dosis: 2.0, unidad: 'L/ha', fecha_aplicacion: '2025-11-01', notas: 'Tratamiento de semilla.', costo: 18000, created_at: '2025-11-01 08:00:00', updated_at: '2025-11-01 08:00:00' },
  { crop_id: 5, producto: 'Fosfato Diamónico', dosis: 100.0, unidad: 'kg/ha', fecha_aplicacion: '2026-06-20', notas: 'A la siembra.', costo: 68000, created_at: '2026-06-20 08:00:00', updated_at: '2026-06-20 08:00:00' },
  { crop_id: 5, producto: 'Urea (46-0-0)', dosis: 160.0, unidad: 'kg/ha', fecha_aplicacion: '2026-08-01', notas: 'Macollaje a encañazón.', costo: 76000, created_at: '2026-08-01 08:00:00', updated_at: '2026-08-01 08:00:00' },
  { crop_id: 6, producto: 'UAN 32%', dosis: 200.0, unidad: 'L/ha', fecha_aplicacion: '2025-08-01', notas: 'Fertilización líquida en macollaje.', costo: 110000, created_at: '2025-08-01 08:00:00', updated_at: '2025-08-01 08:00:00' },
  { crop_id: 6, producto: 'Fosfato Monoamónico', dosis: 110.0, unidad: 'kg/ha', fecha_aplicacion: '2025-06-15', notas: 'A la siembra.', costo: 78000, created_at: '2025-06-15 08:00:00', updated_at: '2025-06-15 08:00:00' },
  { crop_id: 7, producto: 'Fosfato Diamónico', dosis: 80.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-20', notas: 'Arrancador.', costo: 56000, created_at: '2025-10-20 08:00:00', updated_at: '2025-10-20 08:00:00' },
  { crop_id: 7, producto: 'Nitrato de Amonio Calcáreo', dosis: 120.0, unidad: 'kg/ha', fecha_aplicacion: '2025-12-01', notas: 'Botón floral. Aporte de calcio.', costo: 62000, created_at: '2025-12-01 08:00:00', updated_at: '2025-12-01 08:00:00' },
  { crop_id: 9, producto: 'Fosfato Diamónico', dosis: 90.0, unidad: 'kg/ha', fecha_aplicacion: '2026-07-01', notas: 'Siembra.', costo: 61000, created_at: '2026-07-01 07:00:00', updated_at: '2026-07-01 07:00:00' },
  { crop_id: 9, producto: 'Urea (46-0-0)', dosis: 140.0, unidad: 'kg/ha', fecha_aplicacion: '2026-08-15', notas: 'Macollaje para proteína.', costo: 67000, created_at: '2026-08-15 07:00:00', updated_at: '2026-08-15 07:00:00' },
  { crop_id: 13, producto: 'Nitrato de Calcio', dosis: 50.0, unidad: 'kg/ha', fecha_aplicacion: '2026-02-01', notas: 'Fertirriego semanal.', costo: 35000, created_at: '2026-02-01 08:00:00', updated_at: '2026-02-01 08:00:00' },
  { crop_id: 13, producto: 'Sulfato de Magnesio', dosis: 30.0, unidad: 'kg/ha', fecha_aplicacion: '2026-02-15', notas: 'Corrección de magnesio.', costo: 22000, created_at: '2026-02-15 08:00:00', updated_at: '2026-02-15 08:00:00' },
  { crop_id: 14, producto: 'Solución Hoagland Modificada', dosis: 5.0, unidad: 'L/semana', fecha_aplicacion: '2026-08-22', notas: 'Solución nutritiva NFT.', costo: 15000, created_at: '2026-08-22 08:00:00', updated_at: '2026-08-22 08:00:00' },
];
await insert('fertilizations', fertilizations);

// ============================================================
// PESTS
// ============================================================
const pests = [
  { crop_id: 1, tipo: 'insecto', nombre: 'Gusano cogollero (Spodoptera frugiperda)', severidad: 'media', fecha_deteccion: '2025-12-10', tratamiento: 'Clorpirifós 48% 1L/ha', estado: 'controlado', notas: 'Aplicación foliar. Umbral superado en V6.', user_id: uid, created_at: '2025-12-10 10:00:00', updated_at: '2025-12-15 10:00:00' },
  { crop_id: 1, tipo: 'enfermedad', nombre: 'Roya común (Puccinia sorghi)', severidad: 'baja', fecha_deteccion: '2026-02-01', tratamiento: 'Azoxistrobina + Ciproconazol 300cc/ha', estado: 'controlado', notas: 'Detección temprana.', user_id: uid, created_at: '2026-02-01 10:00:00', updated_at: '2026-02-05 10:00:00' },
  { crop_id: 2, tipo: 'maleza', nombre: 'Yuyo colorado (Amaranthus palmeri)', severidad: 'alta', fecha_deteccion: '2026-09-15', tratamiento: 'Atrazina + S-metolacloro 4L/ha', estado: 'activo', notas: 'Resistencia confirmada a glifosato.', user_id: uid, created_at: '2026-09-15 09:00:00', updated_at: now() },
  { crop_id: 3, tipo: 'insecto', nombre: 'Chinche verde (Nezara viridula)', severidad: 'media', fecha_deteccion: '2026-02-01', tratamiento: 'Tiametoxam + Lambda-cialotrina 150cc/ha', estado: 'controlado', notas: 'Monitoreo semanal. Aplicación en R4.', user_id: uid, created_at: '2026-02-01 11:00:00', updated_at: '2026-02-10 11:00:00' },
  { crop_id: 3, tipo: 'enfermedad', nombre: 'Mancha marrón (Septoria glycines)', severidad: 'baja', fecha_deteccion: '2026-01-15', tratamiento: null, estado: 'monitoreo', notas: 'Incidencia baja. Sin control químico.', user_id: uid, created_at: '2026-01-15 11:00:00', updated_at: '2026-01-15 11:00:00' },
  { crop_id: 5, tipo: 'enfermedad', nombre: 'Fusariosis de la espiga (Fusarium graminearum)', severidad: 'alta', fecha_deteccion: '2026-08-25', tratamiento: 'Metconazol 800cc/ha', estado: 'activo', notas: 'Condiciones de alta humedad. Aplicación en espigazón.', user_id: uid, created_at: '2026-08-25 08:00:00', updated_at: now() },
  { crop_id: 9, tipo: 'insecto', nombre: 'Pulgón de la espiga (Rhopalosiphum padi)', severidad: 'baja', fecha_deteccion: '2026-08-01', tratamiento: null, estado: 'monitoreo', notas: 'Control biológico activo (mariquitas).', user_id: uid, created_at: '2026-08-01 10:00:00', updated_at: now() },
  { crop_id: 13, tipo: 'insecto', nombre: 'Mosca blanca (Bemisia tabaci)', severidad: 'media', fecha_deteccion: '2026-02-20', tratamiento: 'Jabón potásico + Aceite de neem 2%', estado: 'controlado', notas: 'Trampas cromáticas amarillas en invernadero.', user_id: uid, created_at: '2026-02-20 09:00:00', updated_at: '2026-03-01 09:00:00' },
  { crop_id: 14, tipo: 'enfermedad', nombre: 'Mildiu (Bremia lactucae)', severidad: 'baja', fecha_deteccion: '2026-09-01', tratamiento: 'Fosetil-Al 2g/L', estado: 'activo', notas: 'Ventilación forzada preventiva.', user_id: uid, created_at: '2026-09-01 08:00:00', updated_at: now() },
];
await insert('pests', pests);

// ============================================================
// HARVESTS
// ============================================================
const harvests = [
  { crop_id: 1, cantidad: 12500, unidad: 'kg', fecha_cosecha: '2026-03-20', rendimiento: 10.0, perdidas: 2.5, notas: 'Excelente calidad. Humedad 14.5%.', created_at: '2026-03-20 16:00:00', updated_at: '2026-03-20 16:00:00' },
  { crop_id: 1, cantidad: 3800, unidad: 'kg', fecha_cosecha: '2026-03-21', rendimiento: 10.2, perdidas: 1.8, notas: 'Segundo día. Menor humedad.', created_at: '2026-03-21 16:00:00', updated_at: '2026-03-21 16:00:00' },
  { crop_id: 3, cantidad: 8200, unidad: 'kg', fecha_cosecha: '2026-04-08', rendimiento: 4.5, perdidas: 3.2, notas: 'Buena calidad. Humedad 13%.', created_at: '2026-04-08 18:00:00', updated_at: '2026-04-08 18:00:00' },
  { crop_id: 3, cantidad: 6500, unidad: 'kg', fecha_cosecha: '2026-04-10', rendimiento: 4.4, perdidas: 2.8, notas: 'Algo de desgrane por demora.', created_at: '2026-04-10 18:00:00', updated_at: '2026-04-10 18:00:00' },
  { crop_id: 6, cantidad: 5200, unidad: 'kg', fecha_cosecha: '2025-12-03', rendimiento: 5.3, perdidas: 1.5, notas: 'Proteína 12.8%. Gluten húmedo 28%.', created_at: '2025-12-03 15:00:00', updated_at: '2025-12-03 15:00:00' },
  { crop_id: 7, cantidad: 4200, unidad: 'kg', fecha_cosecha: '2026-03-01', rendimiento: 2.8, perdidas: 4.0, notas: 'Aceite 48%. Alto oleico.', created_at: '2026-03-01 14:00:00', updated_at: '2026-03-01 14:00:00' },
  { crop_id: 7, cantidad: 3800, unidad: 'kg', fecha_cosecha: '2026-03-03', rendimiento: 2.6, perdidas: 5.0, notas: 'Desgrane por viento.', created_at: '2026-03-03 14:00:00', updated_at: '2026-03-03 14:00:00' },
  { crop_id: 10, cantidad: 3400, unidad: 'kg', fecha_cosecha: '2025-11-18', rendimiento: 4.6, perdidas: 2.0, notas: 'Calibre >85%. Premio por calidad.', created_at: '2025-11-18 11:00:00', updated_at: '2025-11-18 11:00:00' },
  { crop_id: 13, cantidad: 850, unidad: 'kg', fecha_cosecha: '2026-03-20', rendimiento: 26.5, perdidas: 8.0, notas: 'Cosecha manual. Mercado fresco.', created_at: '2026-03-20 09:00:00', updated_at: '2026-03-20 09:00:00' },
  { crop_id: 13, cantidad: 620, unidad: 'kg', fecha_cosecha: '2026-04-01', rendimiento: 24.0, perdidas: 10.0, notas: 'Última cosecha. Fin de ciclo.', created_at: '2026-04-01 09:00:00', updated_at: '2026-04-01 09:00:00' },
  { crop_id: 11, cantidad: 2200, unidad: 'kg', fecha_cosecha: '2026-05-15', rendimiento: 6.8, perdidas: 1.5, notas: 'Primer corte alfalfa. Heno de calidad.', created_at: '2026-05-15 10:00:00', updated_at: '2026-05-15 10:00:00' },
  { crop_id: 11, cantidad: 1900, unidad: 'kg', fecha_cosecha: '2026-07-01', rendimiento: 6.2, perdidas: 2.0, notas: 'Segundo corte. Buen stand.', created_at: '2026-07-01 10:00:00', updated_at: '2026-07-01 10:00:00' },
];
await insert('harvests', harvests);

// ============================================================
// INVENTORY
// ============================================================
const inventory = [
  { user_id: uid, nombre: 'Urea (46-0-0)', categoria: 'fertilizante', cantidad: 450, unidad: 'kg', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2027-09-01', costo_unitario: 480, notas: 'Bolsa de 50kg. Granulada.', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
  { user_id: uid, nombre: 'Fosfato Diamónico (18-46-0)', categoria: 'fertilizante', cantidad: 200, unidad: 'kg', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2027-09-01', costo_unitario: 680, notas: 'Bolsa de 50kg.', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
  { user_id: uid, nombre: 'Clorpirifós 48%', categoria: 'insecticida', cantidad: 15, unidad: 'L', fecha_adquisicion: '2025-10-01', fecha_vencimiento: '2027-10-01', costo_unitario: 3200, notas: 'Bidón 5L. Uso restringido.', created_at: '2025-10-01 10:00:00', updated_at: '2025-10-01 10:00:00' },
  { user_id: uid, nombre: 'Azoxistrobina + Ciproconazol', categoria: 'fungicida', cantidad: 8, unidad: 'L', fecha_adquisicion: '2025-11-01', fecha_vencimiento: '2027-11-01', costo_unitario: 8500, notas: 'Bidón 1L. Amplio espectro.', created_at: '2025-11-01 10:00:00', updated_at: '2025-11-01 10:00:00' },
  { user_id: uid, nombre: 'Atrazina 50% SC', categoria: 'herbicida', cantidad: 20, unidad: 'L', fecha_adquisicion: '2025-10-15', fecha_vencimiento: '2027-10-15', costo_unitario: 2800, notas: 'Bidón 5L. Pre-emergente maíz.', created_at: '2025-10-15 10:00:00', updated_at: '2025-10-15 10:00:00' },
  { user_id: uid, nombre: 'Semilla Maíz DK-747 VT3P', categoria: 'semilla', cantidad: 18, unidad: 'bolsa', fecha_adquisicion: '2025-08-01', fecha_vencimiento: '2026-08-01', costo_unitario: 35000, notas: 'Bolsa 60.000 semillas. Híbrido.', created_at: '2025-08-01 10:00:00', updated_at: '2025-08-01 10:00:00' },
  { user_id: uid, nombre: 'Semilla Soja DM 60i62 IPRO', categoria: 'semilla', cantidad: 25, unidad: 'bolsa', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2026-09-01', costo_unitario: 28000, notas: 'Bolsa 40kg. Tratada con inoculante.', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
  { user_id: uid, nombre: 'Semilla Trigo Baguette 802', categoria: 'semilla', cantidad: 20, unidad: 'bolsa', fecha_adquisicion: '2026-04-01', fecha_vencimiento: '2026-12-01', costo_unitario: 18000, notas: 'Bolsa 40kg. Ciclo largo.', created_at: '2026-04-01 10:00:00', updated_at: '2026-04-01 10:00:00' },
  { user_id: uid, nombre: 'Jabón Potásico', categoria: 'insecticida', cantidad: 10, unidad: 'L', fecha_adquisicion: '2026-01-01', fecha_vencimiento: '2027-01-01', costo_unitario: 1200, notas: 'Bidón 5L. Uso orgánico.', created_at: '2026-01-01 10:00:00', updated_at: '2026-01-01 10:00:00' },
  { user_id: uid, nombre: 'Nitrato de Calcio', categoria: 'fertilizante', cantidad: 80, unidad: 'kg', fecha_adquisicion: '2026-01-01', fecha_vencimiento: '2027-01-01', costo_unitario: 750, notas: 'Bolsa 25kg. Para fertirriego.', created_at: '2026-01-01 10:00:00', updated_at: '2026-01-01 10:00:00' },
  { user_id: uid, nombre: 'Aceite de Neem', categoria: 'insecticida', cantidad: 5, unidad: 'L', fecha_adquisicion: '2026-01-01', fecha_vencimiento: '2027-01-01', costo_unitario: 2800, notas: 'Bidón 1L. Orgánico certificado.', created_at: '2026-01-01 10:00:00', updated_at: '2026-01-01 10:00:00' },
  { user_id: uid, nombre: 'Sulfato de Magnesio', categoria: 'fertilizante', cantidad: 50, unidad: 'kg', fecha_adquisicion: '2026-01-15', fecha_vencimiento: '2028-01-15', costo_unitario: 400, notas: 'Bolsa 25kg. Corrector.', created_at: '2026-01-15 10:00:00', updated_at: '2026-01-15 10:00:00' },
  { user_id: uid, nombre: 'S-metolacloro 96%', categoria: 'herbicida', cantidad: 12, unidad: 'L', fecha_adquisicion: '2025-10-01', fecha_vencimiento: '2027-10-01', costo_unitario: 4200, notas: 'Bidón 5L. Pre-emergente.', created_at: '2025-10-01 10:00:00', updated_at: '2025-10-01 10:00:00' },
  { user_id: uid, nombre: 'Metconazol 6%', categoria: 'fungicida', cantidad: 6, unidad: 'L', fecha_adquisicion: '2026-07-01', fecha_vencimiento: '2028-07-01', costo_unitario: 6500, notas: 'Bidón 1L. Específico para fusarium.', created_at: '2026-07-01 10:00:00', updated_at: '2026-07-01 10:00:00' },
];
await insert('inventory', inventory);

// ============================================================
// SUMMARY
// ============================================================
console.log('\n=== SEED COMPLETE ===');

// Get all user tables from the public schema (PostgreSQL-compatible)
const { rows: tableRows } = await db.raw(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE 'knex_%' AND table_type = 'BASE TABLE' ORDER BY table_name"
);
const allTables: string[] = tableRows.map((r: { table_name: string }) => r.table_name);

let totalRows = 0;
for (const t of allTables) {
  const [{ count: c }] = await db(t).count('* as c');
  console.log(`  ${t}: ${Number(c)} rows`);
  totalRows += Number(c);
}
console.log(`\n  TOTAL: ${totalRows} filas en ${allTables.length} tablas`);

await db.destroy();
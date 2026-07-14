import db from './src/db/connection.js';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations complete.');

    // Check if already seeded
    const [{ count }] = await db('parcels').count('* as c');
    const force = process.env.FORCE_RESEED === 'true';
    if (!force && Number(count) > 0) {
      console.log('Data already exists — skipping seed. Set FORCE_RESEED=true to re-seed.');
      return;
    }

    if (force) {
      console.log('FORCE_RESEED=true — clearing all data...');
      const all = ['harvests', 'irrigations', 'fertilizations', 'pests', 'crops', 'inventory', 'parcels'];
      for (const t of all) { await db(t).del(); console.log(`  Cleared ${t}`); }
    }

    const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Admin user
    let uid: number | undefined;
    const adminRow = await db('users').select('id').where({ email: 'admin@agroexec.com' }).first();
    if (adminRow) {
      uid = adminRow.id;
    } else {
      const hash = bcrypt.hashSync('admin123456', 10);
      const [inserted] = await db('users').insert({ email: 'admin@agroexec.com', password_hash: hash, role: 'admin' }).returning('id');
      uid = typeof inserted === 'object' ? (inserted as { id: number }).id : inserted;
      console.log(`  Created admin user (id=${uid})`);
    }

    console.log('\nSeeding data...');

    // ── PARCELS (14) ──
    await db('parcels').insert([
      { user_id: uid, name: 'Lote Norte', area: 12.5, location: 'Sector Norte, coordenadas 34°S', soil_type: 'franco-arenoso', created_at: '2025-08-15 08:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote Sur', area: 18.2, location: 'Sector Sur, lindero al arroyo', soil_type: 'franco-limoso', created_at: '2025-08-15 08:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote Este', area: 9.8, location: 'Sector Este, zona alta', soil_type: 'franco', created_at: '2025-09-01 10:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote Oeste', area: 15.0, location: 'Sector Oeste, terreno ondulado', soil_type: 'arenoso', created_at: '2025-09-01 10:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote Central', area: 7.4, location: 'Centro del campo', soil_type: 'franco-arcilloso', created_at: '2025-10-01 07:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote La Esquina', area: 4.5, location: 'Esquina SE, media sombra', soil_type: 'franco', created_at: '2025-11-01 09:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote Invernadero', area: 1.8, location: 'Bajo cubierta', soil_type: 'tierra-negra', created_at: '2026-01-01 08:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote El Mirador', area: 22.0, location: 'Zona alta, vista panorámica', soil_type: 'franco-arenoso', created_at: '2025-07-01 08:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote La Laguna', area: 6.3, location: 'Cercano a reservorio de agua', soil_type: 'arcilloso', created_at: '2025-10-15 09:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote El Bosque', area: 3.2, location: 'Lindero a monte nativo', soil_type: 'franco', created_at: '2026-02-01 07:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote La Loma', area: 11.0, location: 'Loma con pendiente suave', soil_type: 'franco-limoso', created_at: '2025-12-01 08:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote El Triángulo', area: 5.5, location: 'Esquina NW, forma triangular', soil_type: 'arenoso', created_at: '2026-03-15 10:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote Los Álamos', area: 8.0, location: 'Cortina de álamos al oeste', soil_type: 'franco-arcilloso', created_at: '2025-09-20 08:00:00', updated_at: now() },
      { user_id: uid, name: 'Lote La Tranquera', area: 13.7, location: 'Entrada principal del campo', soil_type: 'franco', created_at: '2026-01-10 09:00:00', updated_at: now() },
    ]);
    console.log('  parcels: 14 rows');

    // ── CROPS (30) ──
    await db('crops').insert([
      // Lote Norte (1) – Maíz
      { parcel_id: 1, variety: 'Maíz DK-747 VT3P', planting_date: '2025-10-15', status: 'cosechado', estimated_harvest_date: '2026-03-20', planting_density: 7.5, notes: 'Híbrido resistente a sequía', created_at: '2025-10-15 06:00:00', updated_at: '2026-03-25 18:00:00' },
      { parcel_id: 1, variety: 'Maíz P2089 VYHR', planting_date: '2026-09-01', status: 'activo', estimated_harvest_date: '2027-02-15', planting_density: 8.0, notes: 'Siembra temprana', created_at: '2026-09-01 07:00:00', updated_at: now() },
      // Lote Sur (2) – Soja
      { parcel_id: 2, variety: 'Soja DM 60i62 IPRO', planting_date: '2025-11-01', status: 'cosechado', estimated_harvest_date: '2026-04-10', planting_density: 35.0, notes: 'Soja de primera', created_at: '2025-11-01 07:00:00', updated_at: '2026-04-15 20:00:00' },
      { parcel_id: 2, variety: 'Soja NS 5028 IPRO', planting_date: '2026-11-15', status: 'planificado', estimated_harvest_date: '2027-04-20', planting_density: 38.0, notes: 'Siembra directa', created_at: '2026-06-15 10:00:00', updated_at: now() },
      // Lote Este (3) – Trigo
      { parcel_id: 3, variety: 'Trigo Baguette 802', planting_date: '2026-06-20', status: 'activo', estimated_harvest_date: '2026-12-01', planting_density: 320.0, notes: 'Trigo pan', created_at: '2026-06-20 06:00:00', updated_at: now() },
      { parcel_id: 3, variety: 'Trigo ACA 303 Plus', planting_date: '2025-06-15', status: 'cosechado', estimated_harvest_date: '2025-12-05', planting_density: 300.0, notes: 'Calidad panadera', created_at: '2025-06-15 06:00:00', updated_at: '2025-12-10 14:00:00' },
      // Lote Oeste (4) – Girasol
      { parcel_id: 4, variety: 'Girasol ACA 882 CL', planting_date: '2025-10-20', status: 'cosechado', estimated_harvest_date: '2026-03-01', planting_density: 5.5, notes: 'Alto oleico', created_at: '2025-10-20 07:00:00', updated_at: '2026-03-05 16:00:00' },
      { parcel_id: 4, variety: 'Girasol SYN 4070 CL', planting_date: '2026-10-01', status: 'activo', estimated_harvest_date: '2027-02-20', planting_density: 6.0, notes: 'Híbrido CL', created_at: '2026-10-01 06:00:00', updated_at: now() },
      // Lote Central (5) – Cebada
      { parcel_id: 5, variety: 'Cebada Andreia', planting_date: '2026-07-01', status: 'activo', estimated_harvest_date: '2026-11-15', planting_density: 280.0, notes: 'Cebada cervecera', created_at: '2026-07-01 07:00:00', updated_at: now() },
      { parcel_id: 5, variety: 'Cebada Montoya', planting_date: '2025-07-10', status: 'cosechado', estimated_harvest_date: '2025-11-20', planting_density: 270.0, notes: 'Calibre >85%', created_at: '2025-07-10 07:00:00', updated_at: '2025-11-25 12:00:00' },
      // Lote La Esquina (6) – Alfalfa
      { parcel_id: 6, variety: 'Alfalfa Monarca SP', planting_date: '2026-03-01', status: 'activo', estimated_harvest_date: '2026-10-15', planting_density: 25.0, notes: 'Perenne, 4 cortes/año', created_at: '2026-03-01 07:00:00', updated_at: now() },
      { parcel_id: 6, variety: 'Alfalfa WL 656 HQ', planting_date: '2025-04-01', status: 'activo', estimated_harvest_date: '2026-05-01', planting_density: 25.0, notes: 'Segundo año, excelente stand', created_at: '2025-04-01 07:00:00', updated_at: now() },
      // Lote Invernadero (7) – Hortalizas
      { parcel_id: 7, variety: 'Tomate Platense', planting_date: '2026-01-15', status: 'cosechado', estimated_harvest_date: '2026-04-01', planting_density: 2.2, notes: 'Riego por goteo', created_at: '2026-01-15 08:00:00', updated_at: '2026-04-10 09:00:00' },
      { parcel_id: 7, variety: 'Lechuga Grand Rapids', planting_date: '2026-08-20', status: 'activo', estimated_harvest_date: '2026-10-15', planting_density: 12.0, notes: 'Hidroponia NFT', created_at: '2026-08-20 06:00:00', updated_at: now() },
      { parcel_id: 7, variety: 'Pimiento California', planting_date: '2026-02-01', status: 'perdido', estimated_harvest_date: '2026-05-15', planting_density: 3.0, notes: 'Helada tardía', created_at: '2026-02-01 07:00:00', updated_at: now() },
      // NUEVOS LOTES
      { parcel_id: 8, variety: 'Soja DM 60i62 IPRO', planting_date: '2025-11-10', status: 'cosechado', estimated_harvest_date: '2026-04-20', planting_density: 36.0, notes: 'Soja de primera, lote extenso', created_at: '2025-11-10 07:00:00', updated_at: '2026-04-25 19:00:00' },
      { parcel_id: 8, variety: 'Maíz DK-747 VT3P', planting_date: '2026-09-10', status: 'activo', estimated_harvest_date: '2027-02-25', planting_density: 7.8, notes: 'Siembra tardía', created_at: '2026-09-10 07:00:00', updated_at: now() },
      { parcel_id: 9, variety: 'Trigo Baguette 802', planting_date: '2026-06-10', status: 'activo', estimated_harvest_date: '2026-11-25', planting_density: 310.0, notes: 'Cercano a fuente de agua', created_at: '2026-06-10 06:00:00', updated_at: now() },
      { parcel_id: 9, variety: 'Arroz Largo Fino', planting_date: '2025-10-01', status: 'cosechado', estimated_harvest_date: '2026-03-15', planting_density: 150.0, notes: 'Inundación controlada', created_at: '2025-10-01 07:00:00', updated_at: '2026-03-20 16:00:00' },
      { parcel_id: 10, variety: 'Alfalfa WL 656 HQ', planting_date: '2026-02-15', status: 'activo', estimated_harvest_date: '2026-09-01', planting_density: 24.0, notes: 'Lindero a monte, rotación ganadera', created_at: '2026-02-15 07:00:00', updated_at: now() },
      { parcel_id: 11, variety: 'Girasol SYN 4070 CL', planting_date: '2025-10-25', status: 'cosechado', estimated_harvest_date: '2026-03-10', planting_density: 6.2, notes: 'Pendiente suave, buen drenaje', created_at: '2025-10-25 07:00:00', updated_at: '2026-03-15 17:00:00' },
      { parcel_id: 11, variety: 'Trigo ACA 303 Plus', planting_date: '2026-06-25', status: 'activo', estimated_harvest_date: '2026-12-10', planting_density: 290.0, notes: 'Rotación post-girasol', created_at: '2026-06-25 06:00:00', updated_at: now() },
      { parcel_id: 12, variety: 'Maíz P2089 VYHR', planting_date: '2026-10-01', status: 'activo', estimated_harvest_date: '2027-03-01', planting_density: 8.2, notes: 'Lote triangular, siembra en curvas de nivel', created_at: '2026-10-01 07:00:00', updated_at: now() },
      { parcel_id: 13, variety: 'Cebada Andreia', planting_date: '2026-07-05', status: 'activo', estimated_harvest_date: '2026-11-20', planting_density: 275.0, notes: 'Protegida por cortina de álamos', created_at: '2026-07-05 07:00:00', updated_at: now() },
      { parcel_id: 13, variety: 'Soja NS 5028 IPRO', planting_date: '2025-11-20', status: 'cosechado', estimated_harvest_date: '2026-04-30', planting_density: 37.0, notes: 'Buena nodulación', created_at: '2025-11-20 07:00:00', updated_at: '2026-05-05 18:00:00' },
      { parcel_id: 14, variety: 'Maíz DK-747 VT3P', planting_date: '2025-10-20', status: 'cosechado', estimated_harvest_date: '2026-03-25', planting_density: 7.3, notes: 'Entrada principal, alta visibilidad', created_at: '2025-10-20 06:00:00', updated_at: '2026-03-30 18:00:00' },
      { parcel_id: 14, variety: 'Soja DM 60i62 IPRO', planting_date: '2026-11-20', status: 'planificado', estimated_harvest_date: '2027-04-25', planting_density: 36.0, notes: 'Rotación post-maíz', created_at: '2026-06-20 10:00:00', updated_at: now() },
      { parcel_id: 2, variety: 'Trigo Baguette 802', planting_date: '2025-06-20', status: 'cosechado', estimated_harvest_date: '2025-12-10', planting_density: 315.0, notes: 'Segunda siembra en lote sur', created_at: '2025-06-20 06:00:00', updated_at: '2025-12-15 14:00:00' },
      { parcel_id: 5, variety: 'Girasol ACA 882 CL', planting_date: '2025-10-30', status: 'cosechado', estimated_harvest_date: '2026-03-15', planting_density: 5.8, notes: 'Rotación post-cebada', created_at: '2025-10-30 07:00:00', updated_at: '2026-03-20 17:00:00' },
      { parcel_id: 8, variety: 'Cebada Montoya', planting_date: '2026-07-10', status: 'activo', estimated_harvest_date: '2026-11-25', planting_density: 268.0, notes: 'Cebada forrajera', created_at: '2026-07-10 07:00:00', updated_at: now() },
    ]);
    console.log('  crops: 30 rows');

    // ── IRRIGATIONS (30) ──
    await db('irrigations').insert([
      { crop_id: 1, amount: 28.0, irrigation_date: '2025-12-01', method: 'pivote-central', duration: 6.0, notes: 'Post-siembra', created_at: '2025-12-01 14:00:00', updated_at: now() },
      { crop_id: 1, amount: 25.0, irrigation_date: '2025-12-20', method: 'pivote-central', duration: 5.5, notes: 'V6', created_at: '2025-12-20 14:00:00', updated_at: now() },
      { crop_id: 1, amount: 32.0, irrigation_date: '2026-01-15', method: 'pivote-central', duration: 7.0, notes: 'Pre-floración', created_at: '2026-01-15 13:00:00', updated_at: now() },
      { crop_id: 2, amount: 22.0, irrigation_date: '2026-09-05', method: 'pivote-central', duration: 5.0, notes: 'Emergencia', created_at: '2026-09-05 15:00:00', updated_at: now() },
      { crop_id: 2, amount: 26.0, irrigation_date: '2026-09-25', method: 'pivote-central', duration: 5.5, notes: 'Desarrollo vegetativo', created_at: '2026-09-25 14:00:00', updated_at: now() },
      { crop_id: 3, amount: 18.0, irrigation_date: '2025-12-15', method: 'aspersion', duration: 8.0, notes: 'Complementario', created_at: '2025-12-15 06:00:00', updated_at: now() },
      { crop_id: 3, amount: 20.0, irrigation_date: '2026-01-20', method: 'aspersion', duration: 9.0, notes: 'Floración R1-R2', created_at: '2026-01-20 06:00:00', updated_at: now() },
      { crop_id: 3, amount: 22.0, irrigation_date: '2026-02-25', method: 'aspersion', duration: 9.5, notes: 'Llenado de vainas', created_at: '2026-02-25 06:00:00', updated_at: now() },
      { crop_id: 5, amount: 16.0, irrigation_date: '2026-07-15', method: 'goteo', duration: 11.0, notes: 'Macollaje', created_at: '2026-07-15 06:00:00', updated_at: now() },
      { crop_id: 5, amount: 20.0, irrigation_date: '2026-08-20', method: 'goteo', duration: 12.5, notes: 'Pre-encanazón', created_at: '2026-08-20 06:00:00', updated_at: now() },
      { crop_id: 6, amount: 15.0, irrigation_date: '2025-08-10', method: 'goteo', duration: 12.0, notes: 'Macollaje', created_at: '2025-08-10 05:00:00', updated_at: now() },
      { crop_id: 6, amount: 20.0, irrigation_date: '2025-09-20', method: 'goteo', duration: 14.0, notes: 'Encañazón', created_at: '2025-09-20 05:00:00', updated_at: now() },
      { crop_id: 7, amount: 14.0, irrigation_date: '2025-11-15', method: 'pivote-central', duration: 4.0, notes: 'Vegetativa', created_at: '2025-11-15 15:00:00', updated_at: now() },
      { crop_id: 7, amount: 18.0, irrigation_date: '2025-12-20', method: 'pivote-central', duration: 5.0, notes: 'Botón floral', created_at: '2025-12-20 15:00:00', updated_at: now() },
      { crop_id: 7, amount: 22.0, irrigation_date: '2026-01-25', method: 'pivote-central', duration: 5.5, notes: 'Floración y llenado', created_at: '2026-01-25 14:00:00', updated_at: now() },
      { crop_id: 8, amount: 15.0, irrigation_date: '2026-10-10', method: 'pivote-central', duration: 4.0, notes: 'Emergencia V4', created_at: '2026-10-10 15:00:00', updated_at: now() },
      { crop_id: 9, amount: 12.0, irrigation_date: '2026-07-20', method: 'aspersion', duration: 8.0, notes: 'Macollaje temprano', created_at: '2026-07-20 05:00:00', updated_at: now() },
      { crop_id: 10, amount: 14.0, irrigation_date: '2025-08-05', method: 'aspersion', duration: 9.0, notes: 'Etapa vegetativa', created_at: '2025-08-05 05:00:00', updated_at: now() },
      { crop_id: 10, amount: 17.0, irrigation_date: '2025-09-10', method: 'aspersion', duration: 10.0, notes: 'Pre-espigazón', created_at: '2025-09-10 05:00:00', updated_at: now() },
      { crop_id: 11, amount: 8.0, irrigation_date: '2026-04-15', method: 'aspersion', duration: 4.0, notes: 'Primer corte', created_at: '2026-04-15 06:00:00', updated_at: now() },
      { crop_id: 11, amount: 10.0, irrigation_date: '2026-06-10', method: 'aspersion', duration: 5.0, notes: 'Segundo corte', created_at: '2026-06-10 06:00:00', updated_at: now() },
      { crop_id: 12, amount: 10.0, irrigation_date: '2026-05-01', method: 'aspersion', duration: 4.5, notes: 'Rebrote post-corte', created_at: '2026-05-01 06:00:00', updated_at: now() },
      { crop_id: 13, amount: 4.0, irrigation_date: '2026-01-20', method: 'goteo', duration: 2.0, notes: 'Invernadero diario', created_at: '2026-01-20 08:00:00', updated_at: now() },
      { crop_id: 13, amount: 6.0, irrigation_date: '2026-03-10', method: 'goteo', duration: 3.0, notes: 'Fructificación', created_at: '2026-03-10 08:00:00', updated_at: now() },
      { crop_id: 14, amount: 2.0, irrigation_date: '2026-08-25', method: 'goteo', duration: 1.5, notes: 'NFT recirculante', created_at: '2026-08-25 08:00:00', updated_at: now() },
      { crop_id: 16, amount: 30.0, irrigation_date: '2025-12-05', method: 'pivote-central', duration: 6.5, notes: 'Post-siembra lote grande', created_at: '2025-12-05 14:00:00', updated_at: now() },
      { crop_id: 16, amount: 35.0, irrigation_date: '2026-01-10', method: 'pivote-central', duration: 7.5, notes: 'Pre-floración', created_at: '2026-01-10 13:00:00', updated_at: now() },
      { crop_id: 17, amount: 24.0, irrigation_date: '2026-09-20', method: 'pivote-central', duration: 5.0, notes: 'Emergencia', created_at: '2026-09-20 15:00:00', updated_at: now() },
      { crop_id: 19, amount: 19.0, irrigation_date: '2025-11-01', method: 'aspersion', duration: 10.0, notes: 'Inundación inicial', created_at: '2025-11-01 06:00:00', updated_at: now() },
      { crop_id: 21, amount: 16.0, irrigation_date: '2025-12-01', method: 'pivote-central', duration: 4.5, notes: 'Etapa vegetativa', created_at: '2025-12-01 15:00:00', updated_at: now() },
    ]);
    console.log('  irrigations: 30 rows');

    // ── FERTILIZATIONS (25) ──
    await db('fertilizations').insert([
      { crop_id: 1, producto: 'Urea (46-0-0)', dosis: 200.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-01', notas: 'V4', costo: 95000, created_at: '2025-11-01 10:00:00', updated_at: now() },
      { crop_id: 1, producto: 'Fosfato Diamónico (18-46-0)', dosis: 120.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-15', notas: 'Siembra', costo: 85000, created_at: '2025-10-15 10:00:00', updated_at: now() },
      { crop_id: 1, producto: 'Nitrato de Amonio', dosis: 150.0, unidad: 'kg/ha', fecha_aplicacion: '2026-01-05', notas: 'Refertilización V10', costo: 68000, created_at: '2026-01-05 10:00:00', updated_at: now() },
      { crop_id: 2, producto: 'Fosfato Monoamónico (11-52-0)', dosis: 130.0, unidad: 'kg/ha', fecha_aplicacion: '2026-09-01', notas: 'Arrancador', costo: 92000, created_at: '2026-09-01 09:00:00', updated_at: now() },
      { crop_id: 2, producto: 'Urea (46-0-0)', dosis: 180.0, unidad: 'kg/ha', fecha_aplicacion: '2026-09-25', notas: 'V6', costo: 86000, created_at: '2026-09-25 09:00:00', updated_at: now() },
      { crop_id: 3, producto: 'Superfosfato Simple', dosis: 150.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-01', notas: 'Fósforo siembra', costo: 45000, created_at: '2025-11-01 08:00:00', updated_at: now() },
      { crop_id: 3, producto: 'Sulfato de Potasio', dosis: 100.0, unidad: 'kg/ha', fecha_aplicacion: '2026-01-01', notas: 'Potasio floración', costo: 72000, created_at: '2026-01-01 08:00:00', updated_at: now() },
      { crop_id: 3, producto: 'Inoculante Bradyrhizobium', dosis: 2.0, unidad: 'L/ha', fecha_aplicacion: '2025-11-01', notas: 'Tratamiento semilla', costo: 18000, created_at: '2025-11-01 08:00:00', updated_at: now() },
      { crop_id: 5, producto: 'Fosfato Diamónico', dosis: 100.0, unidad: 'kg/ha', fecha_aplicacion: '2026-06-20', notas: 'Siembra', costo: 68000, created_at: '2026-06-20 08:00:00', updated_at: now() },
      { crop_id: 5, producto: 'Urea (46-0-0)', dosis: 160.0, unidad: 'kg/ha', fecha_aplicacion: '2026-08-01', notas: 'Macollaje', costo: 76000, created_at: '2026-08-01 08:00:00', updated_at: now() },
      { crop_id: 6, producto: 'UAN 32%', dosis: 200.0, unidad: 'L/ha', fecha_aplicacion: '2025-08-01', notas: 'Fertilización líquida', costo: 110000, created_at: '2025-08-01 08:00:00', updated_at: now() },
      { crop_id: 7, producto: 'Fosfato Diamónico', dosis: 80.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-20', notas: 'Arrancador', costo: 56000, created_at: '2025-10-20 08:00:00', updated_at: now() },
      { crop_id: 7, producto: 'Nitrato de Amonio Calcáreo', dosis: 120.0, unidad: 'kg/ha', fecha_aplicacion: '2025-12-01', notas: 'Calcio en botón floral', costo: 62000, created_at: '2025-12-01 08:00:00', updated_at: now() },
      { crop_id: 9, producto: 'Fosfato Diamónico', dosis: 90.0, unidad: 'kg/ha', fecha_aplicacion: '2026-07-01', notas: 'Siembra', costo: 61000, created_at: '2026-07-01 07:00:00', updated_at: now() },
      { crop_id: 9, producto: 'Urea (46-0-0)', dosis: 140.0, unidad: 'kg/ha', fecha_aplicacion: '2026-08-15', notas: 'Proteína', costo: 67000, created_at: '2026-08-15 07:00:00', updated_at: now() },
      { crop_id: 13, producto: 'Nitrato de Calcio', dosis: 50.0, unidad: 'kg/ha', fecha_aplicacion: '2026-02-01', notas: 'Fertirriego semanal', costo: 35000, created_at: '2026-02-01 08:00:00', updated_at: now() },
      { crop_id: 13, producto: 'Sulfato de Magnesio', dosis: 30.0, unidad: 'kg/ha', fecha_aplicacion: '2026-02-15', notas: 'Corrección Mg', costo: 22000, created_at: '2026-02-15 08:00:00', updated_at: now() },
      { crop_id: 14, producto: 'Solución Hoagland Modificada', dosis: 5.0, unidad: 'L/semana', fecha_aplicacion: '2026-08-22', notas: 'Nutritiva NFT', costo: 15000, created_at: '2026-08-22 08:00:00', updated_at: now() },
      { crop_id: 16, producto: 'Fosfato Diamónico', dosis: 130.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-10', notas: 'Siembra lote grande', costo: 92000, created_at: '2025-11-10 09:00:00', updated_at: now() },
      { crop_id: 16, producto: 'Urea (46-0-0)', dosis: 220.0, unidad: 'kg/ha', fecha_aplicacion: '2026-01-01', notas: 'V6', costo: 105000, created_at: '2026-01-01 09:00:00', updated_at: now() },
      { crop_id: 18, producto: 'Fosfato Diamónico', dosis: 110.0, unidad: 'kg/ha', fecha_aplicacion: '2026-06-10', notas: 'Siembra cerca agua', costo: 75000, created_at: '2026-06-10 08:00:00', updated_at: now() },
      { crop_id: 19, producto: 'Urea (46-0-0)', dosis: 180.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-15', notas: 'Inundación + N', costo: 86000, created_at: '2025-10-15 08:00:00', updated_at: now() },
      { crop_id: 21, producto: 'Fosfato Diamónico', dosis: 90.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-25', notas: 'Arrancador girasol', costo: 61000, created_at: '2025-10-25 08:00:00', updated_at: now() },
      { crop_id: 21, producto: 'Sulfato de Potasio', dosis: 80.0, unidad: 'kg/ha', fecha_aplicacion: '2026-01-15', notas: 'Floración', costo: 58000, created_at: '2026-01-15 08:00:00', updated_at: now() },
      { crop_id: 26, producto: 'Fosfato Diamónico', dosis: 140.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-20', notas: 'Siembra maíz en tranquera', costo: 98000, created_at: '2025-10-20 08:00:00', updated_at: now() },
    ]);
    console.log('  fertilizations: 25 rows');

    // ── PESTS (15) ──
    await db('pests').insert([
      { crop_id: 1, tipo: 'insecto', nombre: 'Gusano cogollero (Spodoptera frugiperda)', severidad: 'media', fecha_deteccion: '2025-12-10', tratamiento: 'Clorpirifós 48% 1L/ha', estado: 'controlado', user_id: uid, created_at: '2025-12-10 10:00:00', updated_at: now() },
      { crop_id: 1, tipo: 'enfermedad', nombre: 'Roya común (Puccinia sorghi)', severidad: 'baja', fecha_deteccion: '2026-02-01', tratamiento: 'Azoxistrobina + Ciproconazol 300cc/ha', estado: 'controlado', user_id: uid, created_at: '2026-02-01 10:00:00', updated_at: now() },
      { crop_id: 2, tipo: 'maleza', nombre: 'Yuyo colorado (Amaranthus palmeri)', severidad: 'alta', fecha_deteccion: '2026-09-15', tratamiento: 'Atrazina + S-metolacloro 4L/ha', estado: 'activo', user_id: uid, created_at: '2026-09-15 09:00:00', updated_at: now() },
      { crop_id: 3, tipo: 'insecto', nombre: 'Chinche verde (Nezara viridula)', severidad: 'media', fecha_deteccion: '2026-02-01', tratamiento: 'Tiametoxam + Lambda-cialotrina 150cc/ha', estado: 'controlado', user_id: uid, created_at: '2026-02-01 11:00:00', updated_at: now() },
      { crop_id: 3, tipo: 'enfermedad', nombre: 'Mancha marrón (Septoria glycines)', severidad: 'baja', fecha_deteccion: '2026-01-15', tratamiento: null, estado: 'monitoreo', user_id: uid, created_at: '2026-01-15 11:00:00', updated_at: now() },
      { crop_id: 5, tipo: 'enfermedad', nombre: 'Fusariosis de la espiga (Fusarium graminearum)', severidad: 'alta', fecha_deteccion: '2026-08-25', tratamiento: 'Metconazol 800cc/ha', estado: 'activo', user_id: uid, created_at: '2026-08-25 08:00:00', updated_at: now() },
      { crop_id: 9, tipo: 'insecto', nombre: 'Pulgón de la espiga (Rhopalosiphum padi)', severidad: 'baja', fecha_deteccion: '2026-08-01', tratamiento: null, estado: 'monitoreo', user_id: uid, created_at: '2026-08-01 10:00:00', updated_at: now() },
      { crop_id: 12, tipo: 'insecto', nombre: 'Pulgón verde (Acyrthosiphon pisum)', severidad: 'baja', fecha_deteccion: '2026-05-20', tratamiento: 'Control biológico con mariquitas', estado: 'controlado', user_id: uid, created_at: '2026-05-20 09:00:00', updated_at: now() },
      { crop_id: 13, tipo: 'insecto', nombre: 'Mosca blanca (Bemisia tabaci)', severidad: 'media', fecha_deteccion: '2026-02-20', tratamiento: 'Jabón potásico + Aceite de neem 2%', estado: 'controlado', user_id: uid, created_at: '2026-02-20 09:00:00', updated_at: now() },
      { crop_id: 14, tipo: 'enfermedad', nombre: 'Mildiu (Bremia lactucae)', severidad: 'baja', fecha_deteccion: '2026-09-01', tratamiento: 'Fosetil-Al 2g/L', estado: 'activo', user_id: uid, created_at: '2026-09-01 08:00:00', updated_at: now() },
      { crop_id: 16, tipo: 'maleza', nombre: 'Rama negra (Conyza bonariensis)', severidad: 'media', fecha_deteccion: '2026-01-10', tratamiento: 'Glifosato 3L/ha + 2,4-D 1L/ha', estado: 'controlado', user_id: uid, created_at: '2026-01-10 10:00:00', updated_at: now() },
      { crop_id: 18, tipo: 'enfermedad', nombre: 'Mancha amarilla (Drechslera tritici-repentis)', severidad: 'media', fecha_deteccion: '2026-08-15', tratamiento: 'Azoxistrobina 200cc/ha', estado: 'activo', user_id: uid, created_at: '2026-08-15 09:00:00', updated_at: now() },
      { crop_id: 21, tipo: 'insecto', nombre: 'Isoca medidora (Rachiplusia nu)', severidad: 'media', fecha_deteccion: '2026-01-20', tratamiento: 'Clorpirifós 48% 0.8L/ha', estado: 'controlado', user_id: uid, created_at: '2026-01-20 10:00:00', updated_at: now() },
      { crop_id: 26, tipo: 'maleza', nombre: 'Sorgo de Alepo (Sorghum halepense)', severidad: 'alta', fecha_deteccion: '2025-12-01', tratamiento: 'Nicosulfurón 1.5L/ha', estado: 'controlado', user_id: uid, created_at: '2025-12-01 09:00:00', updated_at: now() },
      { crop_id: 2, tipo: 'enfermedad', nombre: 'Roya asiática (Phakopsora pachyrhizi)', severidad: 'baja', fecha_deteccion: '2026-10-01', tratamiento: null, estado: 'monitoreo', user_id: uid, created_at: '2026-10-01 10:00:00', updated_at: now() },
    ]);
    console.log('  pests: 15 rows');

    // ── HARVESTS (20) ──
    await db('harvests').insert([
      { crop_id: 1, cantidad: 12500, unidad: 'kg', fecha_cosecha: '2026-03-20', rendimiento: 10.0, perdidas: 2.5, created_at: '2026-03-20 16:00:00', updated_at: now() },
      { crop_id: 1, cantidad: 3800, unidad: 'kg', fecha_cosecha: '2026-03-21', rendimiento: 10.2, perdidas: 1.8, created_at: '2026-03-21 16:00:00', updated_at: now() },
      { crop_id: 3, cantidad: 8200, unidad: 'kg', fecha_cosecha: '2026-04-08', rendimiento: 4.5, perdidas: 3.2, created_at: '2026-04-08 18:00:00', updated_at: now() },
      { crop_id: 3, cantidad: 6500, unidad: 'kg', fecha_cosecha: '2026-04-10', rendimiento: 4.4, perdidas: 2.8, created_at: '2026-04-10 18:00:00', updated_at: now() },
      { crop_id: 6, cantidad: 5200, unidad: 'kg', fecha_cosecha: '2025-12-03', rendimiento: 5.3, perdidas: 1.5, created_at: '2025-12-03 15:00:00', updated_at: now() },
      { crop_id: 7, cantidad: 4200, unidad: 'kg', fecha_cosecha: '2026-03-01', rendimiento: 2.8, perdidas: 4.0, created_at: '2026-03-01 14:00:00', updated_at: now() },
      { crop_id: 7, cantidad: 3800, unidad: 'kg', fecha_cosecha: '2026-03-03', rendimiento: 2.6, perdidas: 5.0, created_at: '2026-03-03 14:00:00', updated_at: now() },
      { crop_id: 10, cantidad: 3400, unidad: 'kg', fecha_cosecha: '2025-11-18', rendimiento: 4.6, perdidas: 2.0, created_at: '2025-11-18 11:00:00', updated_at: now() },
      { crop_id: 13, cantidad: 850, unidad: 'kg', fecha_cosecha: '2026-03-20', rendimiento: 26.5, perdidas: 8.0, created_at: '2026-03-20 09:00:00', updated_at: now() },
      { crop_id: 16, cantidad: 39000, unidad: 'kg', fecha_cosecha: '2026-04-18', rendimiento: 5.1, perdidas: 2.2, created_at: '2026-04-18 16:00:00', updated_at: now() },
      { crop_id: 16, cantidad: 14200, unidad: 'kg', fecha_cosecha: '2026-04-20', rendimiento: 5.3, perdidas: 1.9, created_at: '2026-04-20 17:00:00', updated_at: now() },
      { crop_id: 19, cantidad: 6800, unidad: 'kg', fecha_cosecha: '2026-03-12', rendimiento: 4.5, perdidas: 3.0, created_at: '2026-03-12 15:00:00', updated_at: now() },
      { crop_id: 21, cantidad: 9100, unidad: 'kg', fecha_cosecha: '2026-03-08', rendimiento: 2.6, perdidas: 3.5, created_at: '2026-03-08 14:00:00', updated_at: now() },
      { crop_id: 25, cantidad: 8500, unidad: 'kg', fecha_cosecha: '2026-04-28', rendimiento: 4.8, perdidas: 2.8, created_at: '2026-04-28 18:00:00', updated_at: now() },
      { crop_id: 26, cantidad: 17500, unidad: 'kg', fecha_cosecha: '2026-03-22', rendimiento: 10.5, perdidas: 1.5, created_at: '2026-03-22 16:00:00', updated_at: now() },
      { crop_id: 28, cantidad: 4800, unidad: 'kg', fecha_cosecha: '2025-12-15', rendimiento: 5.1, perdidas: 1.8, created_at: '2025-12-15 14:00:00', updated_at: now() },
      { crop_id: 29, cantidad: 5200, unidad: 'kg', fecha_cosecha: '2026-03-18', rendimiento: 2.5, perdidas: 3.2, created_at: '2026-03-18 16:00:00', updated_at: now() },
      { crop_id: 11, cantidad: 2200, unidad: 'kg', fecha_cosecha: '2026-05-15', rendimiento: 6.8, perdidas: 1.5, created_at: '2026-05-15 10:00:00', updated_at: now() },
      { crop_id: 11, cantidad: 1900, unidad: 'kg', fecha_cosecha: '2026-07-01', rendimiento: 6.2, perdidas: 2.0, created_at: '2026-07-01 10:00:00', updated_at: now() },
      { crop_id: 13, cantidad: 620, unidad: 'kg', fecha_cosecha: '2026-04-01', rendimiento: 24.0, perdidas: 10.0, created_at: '2026-04-01 09:00:00', updated_at: now() },
    ]);
    console.log('  harvests: 20 rows');

    // ── INVENTORY (20) ──
    await db('inventory').insert([
      { user_id: uid, nombre: 'Urea (46-0-0)', categoria: 'fertilizante', cantidad: 450, unidad: 'kg', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2027-09-01', costo_unitario: 480, created_at: '2025-09-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Fosfato Diamónico (18-46-0)', categoria: 'fertilizante', cantidad: 200, unidad: 'kg', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2027-09-01', costo_unitario: 680, created_at: '2025-09-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Clorpirifós 48%', categoria: 'insecticida', cantidad: 15, unidad: 'L', fecha_adquisicion: '2025-10-01', fecha_vencimiento: '2027-10-01', costo_unitario: 3200, created_at: '2025-10-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Azoxistrobina + Ciproconazol', categoria: 'fungicida', cantidad: 8, unidad: 'L', fecha_adquisicion: '2025-11-01', fecha_vencimiento: '2027-11-01', costo_unitario: 8500, created_at: '2025-11-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Atrazina 50% SC', categoria: 'herbicida', cantidad: 20, unidad: 'L', fecha_adquisicion: '2025-10-15', fecha_vencimiento: '2027-10-15', costo_unitario: 2800, created_at: '2025-10-15 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Semilla Maíz DK-747 VT3P', categoria: 'semilla', cantidad: 18, unidad: 'bolsa', fecha_adquisicion: '2025-08-01', fecha_vencimiento: '2026-08-01', costo_unitario: 35000, created_at: '2025-08-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Semilla Soja DM 60i62 IPRO', categoria: 'semilla', cantidad: 25, unidad: 'bolsa', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2026-09-01', costo_unitario: 28000, created_at: '2025-09-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Semilla Trigo Baguette 802', categoria: 'semilla', cantidad: 3, unidad: 'bolsa', fecha_adquisicion: '2026-04-01', fecha_vencimiento: '2026-12-01', costo_unitario: 18000, created_at: '2026-04-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Jabón Potásico', categoria: 'insecticida', cantidad: 2, unidad: 'L', fecha_adquisicion: '2026-01-01', fecha_vencimiento: '2027-01-01', costo_unitario: 1200, created_at: '2026-01-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Nitrato de Calcio', categoria: 'fertilizante', cantidad: 80, unidad: 'kg', fecha_adquisicion: '2026-01-01', fecha_vencimiento: '2027-01-01', costo_unitario: 750, created_at: '2026-01-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Aceite de Neem', categoria: 'insecticida', cantidad: 5, unidad: 'L', fecha_adquisicion: '2026-01-01', fecha_vencimiento: '2027-01-01', costo_unitario: 2800, created_at: '2026-01-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Sulfato de Magnesio', categoria: 'fertilizante', cantidad: 4, unidad: 'kg', fecha_adquisicion: '2026-01-15', fecha_vencimiento: '2028-01-15', costo_unitario: 400, created_at: '2026-01-15 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'S-metolacloro 96%', categoria: 'herbicida', cantidad: 12, unidad: 'L', fecha_adquisicion: '2025-10-01', fecha_vencimiento: '2027-10-01', costo_unitario: 4200, created_at: '2025-10-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Metconazol 6%', categoria: 'fungicida', cantidad: 1, unidad: 'L', fecha_adquisicion: '2026-07-01', fecha_vencimiento: '2028-07-01', costo_unitario: 6500, created_at: '2026-07-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Glifosato 62%', categoria: 'herbicida', cantidad: 30, unidad: 'L', fecha_adquisicion: '2025-08-15', fecha_vencimiento: '2027-08-15', costo_unitario: 1800, created_at: '2025-08-15 10:00:00', updated_at: now() },
      { user_id: uid, nombre: '2,4-D Amina 60%', categoria: 'herbicida', cantidad: 25, unidad: 'L', fecha_adquisicion: '2025-09-10', fecha_vencimiento: '2027-09-10', costo_unitario: 1500, created_at: '2025-09-10 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Tiametoxam + Lambda-cialotrina', categoria: 'insecticida', cantidad: 10, unidad: 'L', fecha_adquisicion: '2025-11-20', fecha_vencimiento: '2027-11-20', costo_unitario: 5600, created_at: '2025-11-20 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Semilla Girasol SYN 4070 CL', categoria: 'semilla', cantidad: 12, unidad: 'bolsa', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2026-09-01', costo_unitario: 22000, created_at: '2025-09-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Semilla Cebada Andreia', categoria: 'semilla', cantidad: 15, unidad: 'bolsa', fecha_adquisicion: '2026-05-01', fecha_vencimiento: '2027-05-01', costo_unitario: 16000, created_at: '2026-05-01 10:00:00', updated_at: now() },
      { user_id: uid, nombre: 'Fosfato Monoamónico (11-52-0)', categoria: 'fertilizante', cantidad: 3, unidad: 'kg', fecha_adquisicion: '2025-10-01', fecha_vencimiento: '2027-10-01', costo_unitario: 920, created_at: '2025-10-01 10:00:00', updated_at: now() },
    ]);
    console.log('  inventory: 20 rows');

    console.log('\n=== SEED COMPLETE ===');
    console.log('  Total: 14 parcels, 30 crops, 30 irrigations, 25 fertilizations, 15 pests, 20 harvests, 20 inventory');
  } catch (err) {
    console.error('Seed failed:', (err as Error).message);
  } finally {
    await db.destroy();
  }
}

seed();

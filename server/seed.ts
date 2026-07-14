import db from './src/db/connection.js';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    // 1. Run migrations first (creates tables if needed)
    console.log('Running migrations...');
    await db.migrate.latest();
    console.log('Migrations complete.');

    // 2. Check if already seeded
    const [{ count }] = await db('parcels').count('* as c');
    if (Number(count) > 0) {
      console.log('Data already exists — skipping seed.');
      return;
    }

    // 3. Clean existing data (keep users)
    console.log('Cleaning existing data...');
    const tables = ['harvests', 'irrigations', 'fertilizations', 'pests', 'crops', 'inventory', 'parcels'];
    for (const t of tables) {
      await db(t).del();
      console.log(`  Cleared ${t}`);
    }

    const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

    // 4. Resolve admin user
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

    console.log('\nSeeding data...');

    // 5. Insert all data
    await db('parcels').insert([
      { user_id: uid, name: 'Lote Norte', area: 12.5, location: 'Sector Norte', soil_type: 'franco-arenoso', created_at: '2025-08-15 08:00:00', updated_at: '2025-08-15 08:00:00' },
      { user_id: uid, name: 'Lote Sur', area: 18.2, location: 'Sector Sur', soil_type: 'franco-limoso', created_at: '2025-08-15 08:00:00', updated_at: '2025-08-15 08:00:00' },
      { user_id: uid, name: 'Lote Este', area: 9.8, location: 'Sector Este', soil_type: 'franco', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
      { user_id: uid, name: 'Lote Oeste', area: 15.0, location: 'Sector Oeste', soil_type: 'arenoso', created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
      { user_id: uid, name: 'Lote Central', area: 7.4, location: 'Centro del campo', soil_type: 'franco-arcilloso', created_at: '2025-10-01 07:00:00', updated_at: '2025-10-01 07:00:00' },
      { user_id: uid, name: 'Lote La Esquina', area: 4.5, location: 'Esquina SE', soil_type: 'franco', created_at: '2025-11-01 09:00:00', updated_at: '2025-11-01 09:00:00' },
      { user_id: uid, name: 'Lote Invernadero', area: 1.8, location: 'Bajo cubierta', soil_type: 'tierra-negra', created_at: '2026-01-01 08:00:00', updated_at: '2026-01-01 08:00:00' },
    ]);
    console.log(`  parcels: 7 rows`);

    await db('crops').insert([
      { parcel_id: 1, variety: 'Maíz DK-747 VT3P', planting_date: '2025-10-15', status: 'cosechado', estimated_harvest_date: '2026-03-20', planting_density: 7.5, notes: 'Híbrido resistente', created_at: '2025-10-15 06:00:00', updated_at: '2026-03-25 18:00:00' },
      { parcel_id: 1, variety: 'Maíz P2089 VYHR', planting_date: '2026-09-01', status: 'activo', estimated_harvest_date: '2027-02-15', planting_density: 8.0, notes: 'Siembra temprana', created_at: '2026-09-01 07:00:00', updated_at: now() },
      { parcel_id: 2, variety: 'Soja DM 60i62 IPRO', planting_date: '2025-11-01', status: 'cosechado', estimated_harvest_date: '2026-04-10', planting_density: 35.0, notes: 'Soja de primera', created_at: '2025-11-01 07:00:00', updated_at: '2026-04-15 20:00:00' },
      { parcel_id: 2, variety: 'Soja NS 5028 IPRO', planting_date: '2026-11-15', status: 'planificado', estimated_harvest_date: '2027-04-20', planting_density: 38.0, notes: 'Siembra directa', created_at: '2026-06-15 10:00:00', updated_at: now() },
      { parcel_id: 3, variety: 'Trigo Baguette 802', planting_date: '2026-06-20', status: 'activo', estimated_harvest_date: '2026-12-01', planting_density: 320.0, notes: 'Trigo pan', created_at: '2026-06-20 06:00:00', updated_at: now() },
      { parcel_id: 3, variety: 'Trigo ACA 303 Plus', planting_date: '2025-06-15', status: 'cosechado', estimated_harvest_date: '2025-12-05', planting_density: 300.0, notes: 'Calidad panadera', created_at: '2025-06-15 06:00:00', updated_at: '2025-12-10 14:00:00' },
      { parcel_id: 4, variety: 'Girasol ACA 882 CL', planting_date: '2025-10-20', status: 'cosechado', estimated_harvest_date: '2026-03-01', planting_density: 5.5, notes: 'Alto oleico', created_at: '2025-10-20 07:00:00', updated_at: '2026-03-05 16:00:00' },
      { parcel_id: 4, variety: 'Girasol SYN 4070 CL', planting_date: '2026-10-01', status: 'activo', estimated_harvest_date: '2027-02-20', planting_density: 6.0, notes: 'Híbrido CL', created_at: '2026-10-01 06:00:00', updated_at: now() },
      { parcel_id: 5, variety: 'Cebada Andreia', planting_date: '2026-07-01', status: 'activo', estimated_harvest_date: '2026-11-15', planting_density: 280.0, notes: 'Cebada cervecera', created_at: '2026-07-01 07:00:00', updated_at: now() },
      { parcel_id: 6, variety: 'Alfalfa Monarca SP', planting_date: '2026-03-01', status: 'activo', estimated_harvest_date: '2026-10-15', planting_density: 25.0, notes: 'Perenne', created_at: '2026-03-01 07:00:00', updated_at: now() },
      { parcel_id: 7, variety: 'Tomate Platense', planting_date: '2026-01-15', status: 'cosechado', estimated_harvest_date: '2026-04-01', planting_density: 2.2, notes: 'Invernadero', created_at: '2026-01-15 08:00:00', updated_at: '2026-04-10 09:00:00' },
      { parcel_id: 7, variety: 'Lechuga Grand Rapids', planting_date: '2026-08-20', status: 'activo', estimated_harvest_date: '2026-10-15', planting_density: 12.0, notes: 'Hidroponia NFT', created_at: '2026-08-20 06:00:00', updated_at: now() },
    ]);
    console.log(`  crops: 12 rows`);

    await db('irrigations').insert([
      { crop_id: 1, amount: 28.0, irrigation_date: '2025-12-01', method: 'pivote-central', duration: 6.0, notes: 'Post-siembra', created_at: '2025-12-01 14:00:00', updated_at: '2025-12-01 14:00:00' },
      { crop_id: 1, amount: 25.0, irrigation_date: '2025-12-20', method: 'pivote-central', duration: 5.5, notes: 'V6', created_at: '2025-12-20 14:00:00', updated_at: '2025-12-20 14:00:00' },
      { crop_id: 2, amount: 22.0, irrigation_date: '2026-09-05', method: 'pivote-central', duration: 5.0, notes: 'Emergencia', created_at: '2026-09-05 15:00:00', updated_at: '2026-09-05 15:00:00' },
      { crop_id: 3, amount: 18.0, irrigation_date: '2025-12-15', method: 'aspersion', duration: 8.0, notes: 'Complementario', created_at: '2025-12-15 06:00:00', updated_at: '2025-12-15 06:00:00' },
      { crop_id: 6, amount: 15.0, irrigation_date: '2025-08-10', method: 'goteo', duration: 12.0, notes: 'Macollaje', created_at: '2025-08-10 05:00:00', updated_at: '2025-08-10 05:00:00' },
      { crop_id: 6, amount: 20.0, irrigation_date: '2025-09-20', method: 'goteo', duration: 14.0, notes: 'Encañazón', created_at: '2025-09-20 05:00:00', updated_at: '2025-09-20 05:00:00' },
      { crop_id: 5, amount: 16.0, irrigation_date: '2026-07-15', method: 'goteo', duration: 11.0, notes: 'Macollaje', created_at: '2026-07-15 06:00:00', updated_at: '2026-07-15 06:00:00' },
      { crop_id: 7, amount: 14.0, irrigation_date: '2025-11-15', method: 'pivote-central', duration: 4.0, notes: 'Vegetativa', created_at: '2025-11-15 15:00:00', updated_at: '2025-11-15 15:00:00' },
    ]);
    console.log(`  irrigations: 8 rows`);

    await db('fertilizations').insert([
      { crop_id: 1, producto: 'Urea (46-0-0)', dosis: 200.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-01', notas: 'V4', costo: 95000, created_at: '2025-11-01 10:00:00', updated_at: '2025-11-01 10:00:00' },
      { crop_id: 1, producto: 'Fosfato Diamónico', dosis: 120.0, unidad: 'kg/ha', fecha_aplicacion: '2025-10-15', notas: 'Siembra', costo: 85000, created_at: '2025-10-15 10:00:00', updated_at: '2025-10-15 10:00:00' },
      { crop_id: 2, producto: 'Fosfato Monoamónico', dosis: 130.0, unidad: 'kg/ha', fecha_aplicacion: '2026-09-01', notas: 'Arrancador', costo: 92000, created_at: '2026-09-01 09:00:00', updated_at: '2026-09-01 09:00:00' },
      { crop_id: 3, producto: 'Superfosfato Simple', dosis: 150.0, unidad: 'kg/ha', fecha_aplicacion: '2025-11-01', notas: 'Fósforo', costo: 45000, created_at: '2025-11-01 08:00:00', updated_at: '2025-11-01 08:00:00' },
      { crop_id: 5, producto: 'Fosfato Diamónico', dosis: 100.0, unidad: 'kg/ha', fecha_aplicacion: '2026-06-20', notas: 'Siembra', costo: 68000, created_at: '2026-06-20 08:00:00', updated_at: '2026-06-20 08:00:00' },
    ]);
    console.log(`  fertilizations: 5 rows`);

    await db('pests').insert([
      { crop_id: 1, tipo: 'insecto', nombre: 'Gusano cogollero', severidad: 'media', fecha_deteccion: '2025-12-10', tratamiento: 'Clorpirifós 48%', estado: 'controlado', user_id: uid, created_at: '2025-12-10 10:00:00', updated_at: '2025-12-15 10:00:00' },
      { crop_id: 2, tipo: 'maleza', nombre: 'Yuyo colorado', severidad: 'alta', fecha_deteccion: '2026-09-15', tratamiento: 'Atrazina + S-metolacloro', estado: 'activo', user_id: uid, created_at: '2026-09-15 09:00:00', updated_at: now() },
      { crop_id: 5, tipo: 'enfermedad', nombre: 'Fusariosis', severidad: 'alta', fecha_deteccion: '2026-08-25', tratamiento: 'Metconazol', estado: 'activo', user_id: uid, created_at: '2026-08-25 08:00:00', updated_at: now() },
    ]);
    console.log(`  pests: 3 rows`);

    await db('harvests').insert([
      { crop_id: 1, cantidad: 12500, unidad: 'kg', fecha_cosecha: '2026-03-20', rendimiento: 10.0, perdidas: 2.5, created_at: '2026-03-20 16:00:00', updated_at: '2026-03-20 16:00:00' },
      { crop_id: 3, cantidad: 8200, unidad: 'kg', fecha_cosecha: '2026-04-08', rendimiento: 4.5, perdidas: 3.2, created_at: '2026-04-08 18:00:00', updated_at: '2026-04-08 18:00:00' },
      { crop_id: 6, cantidad: 5200, unidad: 'kg', fecha_cosecha: '2025-12-03', rendimiento: 5.3, perdidas: 1.5, created_at: '2025-12-03 15:00:00', updated_at: '2025-12-03 15:00:00' },
      { crop_id: 7, cantidad: 4200, unidad: 'kg', fecha_cosecha: '2026-03-01', rendimiento: 2.8, perdidas: 4.0, created_at: '2026-03-01 14:00:00', updated_at: '2026-03-01 14:00:00' },
    ]);
    console.log(`  harvests: 4 rows`);

    await db('inventory').insert([
      { user_id: uid, nombre: 'Urea (46-0-0)', categoria: 'fertilizante', cantidad: 450, unidad: 'kg', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2027-09-01', costo_unitario: 480, created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
      { user_id: uid, nombre: 'Fosfato Diamónico', categoria: 'fertilizante', cantidad: 200, unidad: 'kg', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2027-09-01', costo_unitario: 680, created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
      { user_id: uid, nombre: 'Clorpirifós 48%', categoria: 'insecticida', cantidad: 15, unidad: 'L', fecha_adquisicion: '2025-10-01', fecha_vencimiento: '2027-10-01', costo_unitario: 3200, created_at: '2025-10-01 10:00:00', updated_at: '2025-10-01 10:00:00' },
      { user_id: uid, nombre: 'Semilla Maíz DK-747', categoria: 'semilla', cantidad: 18, unidad: 'bolsa', fecha_adquisicion: '2025-08-01', fecha_vencimiento: '2026-08-01', costo_unitario: 35000, created_at: '2025-08-01 10:00:00', updated_at: '2025-08-01 10:00:00' },
      { user_id: uid, nombre: 'Semilla Soja DM 60i62', categoria: 'semilla', cantidad: 25, unidad: 'bolsa', fecha_adquisicion: '2025-09-01', fecha_vencimiento: '2026-09-01', costo_unitario: 28000, created_at: '2025-09-01 10:00:00', updated_at: '2025-09-01 10:00:00' },
    ]);
    console.log(`  inventory: 5 rows`);

    console.log('\n=== SEED COMPLETE ===');
  } catch (err) {
    console.error('Seed failed:', (err as Error).message);
  } finally {
    await db.destroy();
  }
}

seed();
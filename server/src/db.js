import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from './config.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function connectDb() {
  let uri = config.mongoUri;
  if (!uri) {
    // MongoDB o'rnatilmagan bo'lsa: lokal, diskda saqlanadigan vaqtinchalik server
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.join(here, '..', '.mongo-data');
    fs.mkdirSync(dbPath, { recursive: true });
    const mem = await MongoMemoryServer.create({ instance: { dbPath, port: 27018, storageEngine: 'wiredTiger' } });
    uri = mem.getUri('uwedrepo');
    console.log('[db] lokal MongoDB:', uri);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  // email endi ixtiyoriy (sparse unique): eski indeksni yangisiga almashtiradi
  const { User } = await import('./models/index.js');
  await User.syncIndexes();
  try {
    const { Booking } = await import('./models/index.js');
    await Booking.syncIndexes(); // ikki marta bron qilishdan himoya qiluvchi noyob indeks
  } catch (e) {
    console.error('[db] bron indeksi yaratilmadi (takroriy bronlar bormi?):', e.message);
  }
  console.log('[db] ulandi');
}

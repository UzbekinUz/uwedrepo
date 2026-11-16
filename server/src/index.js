import { config } from './config.js';
import { connectDb } from './db.js';
import { seedIfEmpty } from './seed.js';
import { loadSettings } from './settings.js';
import { startBot } from './telegram.js';
import { createApp } from './app.js';
import { startReminders } from './reminders.js';

await connectDb();
await seedIfEmpty();
await loadSettings();
await startBot();
startReminders();
createApp().listen(config.port, () => console.log(`[server] http://localhost:${config.port}`));

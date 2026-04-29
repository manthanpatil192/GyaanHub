import { localDB } from './local_db.js';

// MASTER SWITCH: Use Local DB for 100% reliability during presentation
// To switch back to Supabase Cloud, replace this with the original createClient logic
export const supabase = localDB;

console.log('🚀 GyaanHub is running in LOCAL DATABASE MODE');

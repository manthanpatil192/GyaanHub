import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_PATH = path.join(__dirname, 'data.json');

async function migrate() {
  console.log('🚀 Starting migration from JSON to Supabase...');

  if (!fs.existsSync(DATA_PATH)) {
    console.error('❌ data.json not found!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  // Order of migration matters for foreign keys
  // 1. Users
  console.log('👤 Migrating users...');
  if (data.users && data.users.length > 0) {
    const { error } = await supabase.from('users').upsert(data.users);
    if (error) console.error('Error migrating users:', error.message);
  }

  // 2. Modules
  console.log('📚 Migrating modules...');
  if (data.modules && data.modules.length > 0) {
    const { error } = await supabase.from('modules').upsert(data.modules);
    if (error) console.error('Error migrating modules:', error.message);
  }

  // 3. Quizzes
  console.log('📝 Migrating quizzes...');
  if (data.quizzes && data.quizzes.length > 0) {
    const { error } = await supabase.from('quizzes').upsert(data.quizzes);
    if (error) console.error('Error migrating quizzes:', error.message);
  }

  // 4. Questions
  console.log('❓ Migrating questions...');
  if (data.questions && data.questions.length > 0) {
    // Supabase might hit limits with huge arrays, but this is fine for small/medium datasets
    const { error } = await supabase.from('questions').upsert(data.questions);
    if (error) console.error('Error migrating questions:', error.message);
  }

  // 5. Quiz Attempts
  console.log('⏱️ Migrating quiz attempts...');
  if (data.quiz_attempts && data.quiz_attempts.length > 0) {
    const { error } = await supabase.from('quiz_attempts').upsert(data.quiz_attempts);
    if (error) console.error('Error migrating attempts:', error.message);
  }

  // 6. Answers
  console.log('✅ Migrating answers...');
  if (data.answers && data.answers.length > 0) {
      // Chunk answers as they can be large
      const chunkSize = 100;
      for (let i = 0; i < data.answers.length; i += chunkSize) {
          const chunk = data.answers.slice(i, i + chunkSize);
          const { error } = await supabase.from('answers').upsert(chunk);
          if (error) console.error(`Error migrating answers chunk ${i}:`, error.message);
      }
  }

  // 7. Materials
  console.log('📄 Migrating materials...');
  if (data.materials && data.materials.length > 0) {
    const { error } = await supabase.from('materials').upsert(data.materials);
    if (error) console.error('Error migrating materials:', error.message);
  }

  // 8. ER Diagrams
  console.log('📐 Migrating ER diagrams...');
  if (data.er_diagrams && data.er_diagrams.length > 0) {
    const { error } = await supabase.from('er_diagrams').upsert(data.er_diagrams);
    if (error) console.error('Error migrating er_diagrams:', error.message);
  }

  console.log('🏁 Migration finished!');
}

migrate().catch(console.error);

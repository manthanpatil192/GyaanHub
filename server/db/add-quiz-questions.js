/**
 * add-quiz-questions.js
 * 
 * Adds all quizzes and questions from data.json into the live Supabase database.
 * Run: SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node db/add-quiz-questions.js
 * Or:  node db/add-quiz-questions.js (if .env is set up)
 */

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
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('   Run: SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node db/add-quiz-questions.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_PATH = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

async function addQuizzesAndQuestions() {
  console.log('🚀 Starting quiz & question migration to Supabase...\n');

  // ── Step 1: Check what's already in the DB ──────────────────────────────
  const { data: existingQuizzes, error: fetchErr } = await supabase
    .from('quizzes')
    .select('id, title');

  if (fetchErr) {
    console.error('❌ Failed to fetch existing quizzes:', fetchErr.message);
    process.exit(1);
  }

  const existingIds = new Set((existingQuizzes || []).map(q => q.id));
  console.log(`📊 Found ${existingIds.size} existing quizzes in Supabase.`);

  // ── Step 2: Upsert Quizzes ─────────────────────────────────────────────
  console.log('\n📝 Upserting quizzes...');
  // Convert is_active from SQLite integer (0/1) to boolean for Supabase
  const quizzesToUpsert = data.quizzes.map(q => ({
    ...q,
    is_active: q.is_active === 1 || q.is_active === true
  }));

  const { error: quizErr } = await supabase
    .from('quizzes')
    .upsert(quizzesToUpsert, { onConflict: 'id' });

  if (quizErr) {
    console.error('❌ Error upserting quizzes:', quizErr.message);
    process.exit(1);
  }
  console.log(`   ✅ Upserted ${quizzesToUpsert.length} quizzes`);

  // ── Step 3: Upsert Questions ───────────────────────────────────────────
  console.log('\n❓ Upserting questions...');
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('id');

  const existingQIds = new Set((existingQuestions || []).map(q => q.id));
  console.log(`   Found ${existingQIds.size} existing questions.`);

  // Upsert in chunks of 50 to avoid request size limits
  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < data.questions.length; i += chunkSize) {
    const chunk = data.questions.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('questions')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`   ❌ Error upserting questions (chunk ${i}-${i + chunkSize}):`, error.message);
    } else {
      inserted += chunk.length;
      process.stdout.write(`   ↳ ${inserted}/${data.questions.length} questions processed\r`);
    }
  }
  console.log(`\n   ✅ Upserted ${inserted} questions`);

  // ── Step 4: Update quiz total_points to match actual questions ──────────
  console.log('\n🔄 Recalculating total_points for each quiz...');
  for (const quiz of data.quizzes) {
    const quizQuestions = data.questions.filter(q => q.quiz_id === quiz.id);
    const totalPoints = quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

    const { error } = await supabase
      .from('quizzes')
      .update({ total_points: totalPoints })
      .eq('id', quiz.id);

    if (error) {
      console.error(`   ❌ Could not update total_points for ${quiz.title}:`, error.message);
    } else {
      console.log(`   ✅ ${quiz.title}: ${quizQuestions.length} qs, ${totalPoints} pts`);
    }
  }

  // ── Step 5: Summary ───────────────────────────────────────────────────
  console.log('\n🎉 Done! Summary:');
  console.log(`   Quizzes: ${data.quizzes.length}`);
  console.log(`   Questions: ${data.questions.length}`);
  console.log('');
  data.quizzes.forEach(q => {
    const count = data.questions.filter(qs => qs.quiz_id === q.id).length;
    console.log(`   📝 ${q.title} → ${count} questions`);
  });
}

addQuizzesAndQuestions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quizzes.js';
import moduleRoutes from './routes/modules.js';
import resultRoutes from './routes/results.js';
import materialRoutes from './routes/materials.js';
import erDiagramRoutes from './routes/er_diagrams.js';
import chatbotRoutes from './routes/chatbot.js';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!import.meta.dirname) { // polyfill for older node
    const fs = await import('fs');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} else {
    const fs = await import('fs');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/er-diagrams', erDiagramRoutes);
app.use('/api/chatbot', chatbotRoutes);

import { supabase } from './utils/supabase.js';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok-migrated', 
    supabase_configured: !!process.env.SUPABASE_URL,
    timestamp: new Date().toISOString() 
  });
});

// TEMPORARY: Auto-Migration Endpoint for Presentation
app.get('/api/admin/migrate-all', async (req, res) => {
  try {
    const fs = await import('fs');
    const data = JSON.parse(fs.readFileSync('./db/data.json', 'utf8'));
    
    // 1. Users
    if (data.users) await supabase.from('users').upsert(data.users);
    // 2. Modules
    if (data.modules) await supabase.from('modules').upsert(data.modules);
    // 3. Quizzes
    if (data.quizzes) await supabase.from('quizzes').upsert(data.quizzes);
    // 4. Questions
    if (data.questions) {
      for (let i = 0; i < data.questions.length; i += 50) {
        await supabase.from('questions').upsert(data.questions.slice(i, i + 50));
      }
    }
    // 5. Materials
    if (data.materials) await supabase.from('materials').upsert(data.materials);
    
    res.json({ success: true, message: 'All data pushed directly to Mumbai!' });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin DB Dump for Presentation (Supabase)
app.get('/api/admin/dump', async (req, res) => {
  try {
    const { data: users } = await supabase.from('users').select('id, username, email, full_name, role, created_at');
    const { data: modules } = await supabase.from('modules').select('*');
    const { data: quizzes } = await supabase.from('quizzes').select('*');
    const { data: materials } = await supabase.from('materials').select('*');
    
    res.json({
      users: users || [],
      modules: modules || [],
      quizzes: quizzes || [],
      materials: materials || []
    });
  } catch (err) {
    console.error('Dump error:', err);
    res.status(500).json({ error: 'Failed to dump database' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DBMS Platform Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  if (!process.env.SUPABASE_URL) {
    console.warn('⚠️ WARNING: SUPABASE_URL not found in .env');
  }
});

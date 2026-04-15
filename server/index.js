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
    status: 'ok', 
    supabase_configured: !!process.env.SUPABASE_URL,
    timestamp: new Date().toISOString() 
  });
});

// Admin DB Dump for Presentation
app.get('/api/admin/dump', async (req, res) => {
  try {
    const [users, modules, quizzes, materials] = await Promise.all([
      supabase.from('users').select('id, username, email, full_name, role, created_at'),
      supabase.from('modules').select('*'),
      supabase.from('quizzes').select('*'),
      supabase.from('materials').select('*')
    ]);
    res.json({
      users: users.data || [],
      modules: modules.data || [],
      quizzes: quizzes.data || [],
      materials: materials.data || []
    });
  } catch (err) {
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

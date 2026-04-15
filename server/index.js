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
import db from './db/schema.js';

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
app.get('/api/admin/dump', (req, res) => {
  try {
    const users = db.findAll('users').map(u => ({ id: u.id, username: u.username, email: u.email, full_name: u.full_name, role: u.role, created_at: u.created_at }));
    const modules = db.findAll('modules');
    const quizzes = db.findAll('quizzes');
    const materials = db.findAll('materials');
    
    res.json({
      users,
      modules,
      quizzes,
      materials
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

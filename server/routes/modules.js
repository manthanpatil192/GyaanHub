import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/schema.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all modules
router.get('/', async (req, res) => {
  try {
    const modules = db.findAll('modules');
    const enriched = modules.map(m => ({
      ...m,
      quiz_count: db.count('quizzes', q => q.module_id === m.id),
      material_count: db.count('materials', mat => mat.module_id === m.id)
    }));
    res.json(enriched);
  } catch (err) {
    console.error('Get modules error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single module
router.get('/:id', async (req, res) => {
  try {
    const mod = db.findOne('modules', m => m.id === req.params.id);
    if (!mod) return res.status(404).json({ error: 'Module not found' });
    
    res.json({
      ...mod,
      quizzes: db.findAll('quizzes', q => q.module_id === mod.id),
      materials: db.findAll('materials', mat => mat.module_id === mod.id)
    });
  } catch (err) {
    console.error('Get module error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create module (teacher only)
router.post('/', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, content, category, difficulty, icon } = req.body;
    if (!title || !description || !content || !category || !difficulty) {
      return res.status(400).json({ error: 'Title, description, content, category, and difficulty required' });
    }

    const { data: mod, error } = await supabase
      .from('modules')
      .insert([{
        title, description, content, category, difficulty,
        icon: icon || '📚', created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mod);
  } catch (err) {
    console.error('Create module error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update module
router.put('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const updates = {};
    for (const key of ['title', 'description', 'content', 'category', 'difficulty', 'icon']) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data: updated, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Module not found' });
      throw error;
    }

    res.json(updated);
  } catch (err) {
    console.error('Update module error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete module
router.delete('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Module deleted successfully' });
  } catch (err) {
    console.error('Delete module error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

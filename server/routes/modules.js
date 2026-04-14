import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all modules
router.get('/', authenticate, async (req, res) => {
  try {
    // We join with users to get creator name and also need to count quizzes
    // In Supabase/PostgreSQL, we can fetch all and then process, or use RPC
    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        *,
        users (full_name),
        quizzes (id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const modulesList = modules.map(m => ({
      ...m,
      creator_name: m.users?.full_name || 'Unknown',
      quiz_count: m.quizzes?.length || 0
    }));

    res.json(modulesList);
  } catch (err) {
    console.error('Get modules error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single module
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: mod, error } = await supabase
      .from('modules')
      .select(`
        *,
        users (full_name),
        quizzes (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Module not found' });
      throw error;
    }

    const quizzes = (mod.quizzes || [])
      .filter(q => q.is_active)
      .map(({ id, title, description, time_limit_minutes, total_points }) => ({ 
        id, title, description, time_limit_minutes, total_points 
      }));

    res.json({ 
      ...mod, 
      creator_name: mod.users?.full_name, 
      quizzes 
    });
  } catch (err) {
    console.error('Get module error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create module
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

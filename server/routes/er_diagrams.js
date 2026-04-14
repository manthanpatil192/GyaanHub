import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

// Middleware to verify user (simple check for now, can be expanded)
const verifyUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'User ID required' });
  req.userId = userId;
  next();
};

// Get all diagrams for a user
router.get('/', verifyUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('er_diagrams')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a new diagram
router.post('/', verifyUser, async (req, res) => {
  const { name, nodes, connections } = req.body;
  try {
    const { data, error } = await supabase
      .from('er_diagrams')
      .insert({
        user_id: req.userId,
        name,
        nodes,
        connections
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a diagram
router.delete('/:id', verifyUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('er_diagrams')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ message: 'Diagram deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

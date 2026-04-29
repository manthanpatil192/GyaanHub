import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all diagrams for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: diagrams, error } = await supabase
      .from('er_diagrams')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(diagrams);
  } catch (err) {
    console.error('Get diagrams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single diagram
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: diagram, error } = await supabase
      .from('er_diagrams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !diagram) return res.status(404).json({ error: 'Diagram not found' });
    
    // Check ownership
    if (diagram.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(diagram);
  } catch (err) {
    console.error('Get diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save/Update diagram
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, title, nodes, edges } = req.body;
    
    if (id) {
      // Update
      const { data: updated, error } = await supabase
        .from('er_diagrams')
        .update({
          title, nodes, edges, 
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) return res.status(404).json({ error: 'Diagram not found or access denied' });
      return res.json(updated);
    } else {
      // Create
      const { data: newDiagram, error } = await supabase
        .from('er_diagrams')
        .insert([{
          user_id: req.user.id,
          title: title || 'Untitled Diagram',
          nodes: nodes || [],
          edges: edges || []
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(newDiagram);
    }
  } catch (err) {
    console.error('Save diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete diagram
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('er_diagrams')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Diagram deleted successfully' });
  } catch (err) {
    console.error('Delete diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all diagrams for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const diagrams = db.findAll('er_diagrams', d => d.user_id === req.user.id);
    res.json(diagrams);
  } catch (err) {
    console.error('Get diagrams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single diagram
router.get('/:id', authenticate, async (req, res) => {
  try {
    const diagram = db.findOne('er_diagrams', d => d.id === req.params.id);
    if (!diagram) return res.status(404).json({ error: 'Diagram not found' });
    
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
      const updated = db.update('er_diagrams', d => d.id === id && d.user_id === req.user.id, {
        title, nodes, edges, updated_at: new Date().toISOString()
      });
      if (!updated) return res.status(404).json({ error: 'Diagram not found' });
      return res.json(updated);
    } else {
      // Create
      const newDiagram = db.insert('er_diagrams', {
        id: uuid(),
        user_id: req.user.id,
        title: title || 'Untitled Diagram',
        nodes: nodes || [],
        edges: edges || [],
        created_at: new Date().toISOString()
      });
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
    db.delete('er_diagrams', d => d.id === req.params.id && d.user_id === req.user.id);
    res.json({ message: 'Diagram deleted successfully' });
  } catch (err) {
    console.error('Delete diagram error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

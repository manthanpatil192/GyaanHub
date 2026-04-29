import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Configure local disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PPT, DOC files are allowed'));
    }
  }
});

const router = Router();

// Get all materials
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select(`
        *,
        users!materials_created_by_fkey(full_name),
        modules(title),
        purchases(id)
      `);
    
    if (error) throw error;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const materialsList = materials.map(m => {
      // Prepend base URL for local uploads if needed
      const fullUrl = m.url.startsWith('/') ? `${baseUrl}${m.url}` : m.url;
      const hasPurchased = m.purchases?.some(p => p.id) || m.price <= 0;

      return {
        ...m,
        url: fullUrl,
        creator_name: m.users?.full_name || 'Unknown',
        module_title: m.modules?.title || null,
        is_purchased: hasPurchased
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(materialsList);
  } catch (err) {
    console.error('Get materials error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material (non-file)
router.post('/', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, type, url, module_id, thumbnail, slides, price } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const { data: newMaterial, error } = await supabase
      .from('materials')
      .insert([{
        title,
        description: description || '',
        type,
        url: url || '#',
        module_id: module_id || null,
        thumbnail: thumbnail || null,
        slides: slides || null,
        price: parseFloat(price) || 0,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newMaterial);
  } catch (err) {
    console.error('Create material error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload PDF/PPT file to local storage
router.post('/upload', authenticate, requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, module_id, type, price } = req.body;
    const publicUrl = `/uploads/${req.file.filename}`;

    const { data: newMaterial, error } = await supabase
      .from('materials')
      .insert([{
        title: title || req.file.originalname,
        description: description || `Uploaded file: ${req.file.originalname}`,
        type: type || 'pdf',
        price: parseFloat(price) || 2,
        url: publicUrl,
        module_id: module_id || null,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newMaterial);
  } catch (err) {
    console.error('Upload material error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record a purchase
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { material_id, amount } = req.body;

    if (!material_id) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    const { data: newPurchase, error } = await supabase
      .from('purchases')
      .insert([{
        user_id: req.user.id,
        material_id,
        amount: amount || 2,
        status: 'completed'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Material already purchased' });
      throw error;
    }

    res.status(201).json(newPurchase);
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material
router.delete('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(404).json({ error: 'Material not found' });
    res.json({ message: 'Material deleted' });
  } catch (err) {
    console.error('Delete material error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

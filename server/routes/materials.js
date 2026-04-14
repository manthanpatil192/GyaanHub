import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { supabase } from '../utils/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use memory storage for direct cloud streaming
const storage = multer.memoryStorage();

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
        users (full_name),
        modules (title),
        purchases (user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const materialsList = materials.map(m => ({
      ...m,
      creator_name: m.users?.full_name || 'Unknown',
      module_title: m.modules?.title || null,
      is_purchased: m.purchases?.some(p => p.user_id === req.user.id) || m.price <= 0
    }));

    res.json(materialsList);
  } catch (err) {
    console.error('Get materials error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get materials by type
router.get('/type/:type', authenticate, async (req, res) => {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select(`
        *,
        users (full_name),
        modules (title)
      `)
      .eq('type', req.params.type)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const materialsList = materials.map(m => ({
      ...m,
      creator_name: m.users?.full_name || 'Unknown',
      module_title: m.modules?.title || null
    }));

    res.json(materialsList);
  } catch (err) {
    console.error('Get materials by type error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material
router.post('/', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, type, url, module_id, thumbnail, slides } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const { data: material, error } = await supabase
      .from('materials')
      .insert([{
        title, description: description || '',
        type, url: url || '#', module_id: module_id || null,
        thumbnail: thumbnail || null,
        slides: slides || null,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(material);
  } catch (err) {
    console.error('Create material error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload PDF/PPT file
router.post('/upload', authenticate, requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, module_id, type, price } = req.body;

    // Ensure bucket exists (ignores error if it already does)
    await supabase.storage.createBucket('materials', { public: true });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${uuid()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file to cloud storage');
    }

    const { data: publicUrlData } = supabase.storage
      .from('materials')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const { data: material, error } = await supabase
      .from('materials')
      .insert([{
        title: title || req.file.originalname,
        description: description || `Uploaded file: ${req.file.originalname}`,
        type: type || 'pdf',
        price: parseFloat(price) || 0,
        url: publicUrl,
        module_id: module_id || null,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(material);
  } catch (err) {
    console.error('Upload material error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record a purchase (Simulated UPI)
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { material_id, amount } = req.body;

    if (!material_id) {
      return res.status(400).json({ error: 'Material ID is required' });
    }

    const { data, error } = await supabase
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
      if (error.code === '23505') { // Unique constraint
        return res.status(400).json({ error: 'Material already purchased' });
      }
      throw error;
    }

    res.status(201).json(data);
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

    if (error) throw error;
    res.json({ message: 'Material deleted' });
  } catch (err) {
    console.error('Delete material error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

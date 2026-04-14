import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or teacher' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password_hash,
        full_name,
        role
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ 
      id: newUser.id, 
      username: newUser.username, 
      email: newUser.email, 
      full_name: newUser.full_name, 
      role: newUser.role, 
      token: newUser.id 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (!user || (error && error.code !== 'PGRST116') || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      full_name: user.full_name, 
      role: user.role, 
      token: user.id 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

export default router;

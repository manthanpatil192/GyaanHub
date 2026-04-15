import db from '../db/schema.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // In our simplified local store, the token is just the user ID
    const user = db.findOne('users', u => u.id === token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { password_hash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error in auth' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. ${role} role required.` });
    }
    next();
  };
}

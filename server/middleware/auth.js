import db from '../db/schema.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = db.findOne('users', u => u.id === token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { password_hash, ...safeUser } = user;
  req.user = safeUser;
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. ${role} role required.` });
    }
    next();
  };
}

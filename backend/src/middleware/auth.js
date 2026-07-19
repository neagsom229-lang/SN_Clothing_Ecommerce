import { verifyToken } from '../utils/jwt.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
}

// Attaches req.user if a valid token is present, but never blocks the request.
// Used for routes like "create order" that support both guest and logged-in checkout.
export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}

// Blocks the request unless a valid token is present.
// Used for routes like "list my orders" that require a logged-in user.
export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Login required.' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired — please log in again.' });
  }
}

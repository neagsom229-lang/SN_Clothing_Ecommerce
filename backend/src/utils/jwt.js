import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

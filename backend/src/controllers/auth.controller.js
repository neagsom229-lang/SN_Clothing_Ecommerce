import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken } from '../utils/jwt.js';

const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email });

export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        error: 'Name, email, and a password of at least 6 characters are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingRes = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingRes.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insertRes = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), cleanEmail, passwordHash]
    );
    const newUserId = insertRes.rows[0].id;

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [newUserId]);
    const user = userRes.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    const user = userRes.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function me(req, res) {
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

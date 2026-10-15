const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getPool } = require('../config/db');

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── REGISTER ────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, phone } = req.body;
    const pool = getPool();

    // Check existing
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, 'user']
    );

    const userId = result.insertId;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: generateToken(userId),
      user: { id: userId, name: name.trim(), email: email.toLowerCase(), role: 'user' },
    });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Login successful!',
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET PROFILE ─────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, street, city, state, pincode, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, street, city, state, pincode } = req.body;
    const pool = getPool();

    await pool.query(
      `UPDATE users SET
        name    = COALESCE(?, name),
        phone   = COALESCE(?, phone),
        street  = COALESCE(?, street),
        city    = COALESCE(?, city),
        state   = COALESCE(?, state),
        pincode = COALESCE(?, pincode)
       WHERE id = ?`,
      [name || null, phone || null, street || null, city || null, state || null, pincode || null, req.user.id]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, street, city, state, pincode, role FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, message: 'Profile updated.', user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── CHANGE PASSWORD ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = getPool();

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: GET ALL USERS ─────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const pool = getPool();

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({ success: true, total, page, pages: Math.ceil(total / limit), users });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: TOGGLE USER STATUS ───────────────────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, is_active FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'}.`,
      isActive: !!newStatus,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword, getAllUsers, toggleUserStatus };

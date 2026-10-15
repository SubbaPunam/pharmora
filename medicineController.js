const { getPool } = require('../config/db');

// ─── GET ALL MEDICINES ────────────────────────────────────────────
const getMedicines = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const pool = getPool();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE is_active = 1';

    if (category && category !== 'all') {
      where += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      where += ' AND (name LIKE ? OR description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM medicines ${where}`, params);
    const [medicines] = await pool.query(
      `SELECT * FROM medicines ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      medicines,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE MEDICINE ─────────────────────────────────────────
const getMedicineById = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ? AND is_active = 1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, medicine: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: CREATE MEDICINE ───────────────────────────────────────
const createMedicine = async (req, res, next) => {
  try {
    const { name, description, price, mrp, category, manufacturer, dosage, stock, requiresPrescription, badge, image, tags } = req.body;
    const pool = getPool();

    const [result] = await pool.query(
      `INSERT INTO medicines (name, description, price, mrp, category, manufacturer, dosage, stock, requires_prescription, badge, image, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || '', price, mrp || null, category || 'other', manufacturer || 'Generic',
       dosage || null, stock || 100, requiresPrescription ? 1 : 0, badge || '', image || null,
       tags ? JSON.stringify(tags) : null]
    );

    const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Medicine created.', medicine: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: UPDATE MEDICINE ───────────────────────────────────────
const updateMedicine = async (req, res, next) => {
  try {
    const { name, description, price, mrp, category, manufacturer, dosage, stock, requiresPrescription, badge, image, tags, isActive } = req.body;
    const pool = getPool();

    await pool.query(
      `UPDATE medicines SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        mrp = COALESCE(?, mrp),
        category = COALESCE(?, category),
        manufacturer = COALESCE(?, manufacturer),
        dosage = COALESCE(?, dosage),
        stock = COALESCE(?, stock),
        requires_prescription = COALESCE(?, requires_prescription),
        badge = COALESCE(?, badge),
        image = COALESCE(?, image),
        tags = COALESCE(?, tags),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name||null, description||null, price||null, mrp||null, category||null, manufacturer||null,
       dosage||null, stock||null, requiresPrescription!=null?(requiresPrescription?1:0):null,
       badge||null, image||null, tags?JSON.stringify(tags):null,
       isActive!=null?(isActive?1:0):null, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, message: 'Medicine updated.', medicine: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: DELETE MEDICINE ───────────────────────────────────────
const deleteMedicine = async (req, res, next) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE medicines SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Medicine removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine };

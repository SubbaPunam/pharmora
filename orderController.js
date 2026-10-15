const { validationResult } = require('express-validator');
const { getPool } = require('../config/db');

// helper: generate order number
const genOrderNumber = async (pool) => {
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM orders');
  return `PH${String(cnt + 1001).padStart(5, '0')}`;
};

// ─── PLACE ORDER ─────────────────────────────────────────────────
const placeOrder = async (req, res, next) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      conn.release();
      return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }

    const { items, shippingAddress, paymentMethod, notes } = req.body;
    if (!items || items.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    await conn.beginTransaction();

    const enrichedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const [rows] = await conn.query(
        'SELECT id, name, price, stock, image, is_active FROM medicines WHERE id = ? FOR UPDATE',
        [item.medicine || item.id]
      );
      if (rows.length === 0 || !rows[0].is_active) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: `Medicine not available: ${item.name}` });
      }
      const med = rows[0];
      if (med.stock < item.quantity) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${med.name}. Available: ${med.stock}` });
      }

      subtotal += med.price * item.quantity;
      enrichedItems.push({ id: med.id, name: med.name, price: med.price, quantity: item.quantity, image: med.image || '' });

      await conn.query('UPDATE medicines SET stock = stock - ? WHERE id = ?', [item.quantity, med.id]);
    }

    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const discount = 0;
    const totalAmount = subtotal + deliveryFee - discount;
    const orderNumber = await genOrderNumber(pool);
    const estimatedDelivery = new Date(Date.now() + 30 * 60 * 1000);
    const payStatus = paymentMethod === 'cod' ? 'pending' : 'paid';

    const addr = shippingAddress || {};
    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (order_number, user_id, subtotal, delivery_fee, discount, total_amount,
         shipping_street, shipping_city, shipping_state, shipping_pincode,
         status, payment_method, payment_status, estimated_delivery, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderNumber, req.user.id, subtotal, deliveryFee, discount, totalAmount,
       addr.street||null, addr.city||null, addr.state||null, addr.pincode||null,
       'pending', paymentMethod||'cod', payStatus, estimatedDelivery, notes||null]
    );

    const orderId = orderResult.insertId;

    for (const it of enrichedItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, medicine_id, name, price, quantity, image) VALUES (?,?,?,?,?,?)',
        [orderId, it.id, it.name, it.price, it.quantity, it.image]
      );
    }

    await conn.commit();
    conn.release();

    // Fetch full order to return
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [itemRows]  = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! 🎉',
      order: { ...orderRows[0], items: itemRows },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// ─── GET MY ORDERS ───────────────────────────────────────────────
const getMyOrders = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const pool = getPool();

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [req.user.id]);
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );

    // attach items to each order
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({ success: true, total, page, pages: Math.ceil(total / limit), orders });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE ORDER ────────────────────────────────────────────
const getOrderById = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const order = rows[0];
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ─── CANCEL ORDER ────────────────────────────────────────────────
const cancelOrder = async (req, res, next) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (rows.length === 0) { await conn.rollback(); conn.release(); return res.status(404).json({ success: false, message: 'Order not found.' }); }

    const order = rows[0];
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      await conn.rollback(); conn.release();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (['delivered','cancelled'].includes(order.status)) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${order.status}.` });
    }

    // Restore stock
    const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      if (item.medicine_id) {
        await conn.query('UPDATE medicines SET stock = stock + ? WHERE id = ?', [item.quantity, item.medicine_id]);
      }
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', order.id]);
    await conn.commit();
    conn.release();

    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// ─── ADMIN: GET ALL ORDERS ───────────────────────────────────────
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pool = getPool();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (status) { where = 'WHERE o.status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${where}`, params);
    const [orders] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), orders });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: UPDATE ORDER STATUS ──────────────────────────────────
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const pool = getPool();
    let sql = 'UPDATE orders SET status = ?';
    const params = [status];

    if (status === 'delivered') {
      sql += ', delivered_at = NOW(), payment_status = ?';
      params.push('paid');
    }
    sql += ' WHERE id = ?';
    params.push(req.params.id);

    await pool.query(sql, params);
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({ success: true, message: `Order status updated to "${status}".`, order: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: DASHBOARD STATS ──────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const pool = getPool();

    const [[{ totalOrders }]]    = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]]   = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS totalRevenue FROM orders WHERE status != 'cancelled'");
    const [[{ pendingOrders }]]  = await pool.query("SELECT COUNT(*) AS pendingOrders FROM orders WHERE status = 'pending'");
    const [[{ deliveredOrders }]]= await pool.query("SELECT COUNT(*) AS deliveredOrders FROM orders WHERE status = 'delivered'");
    const [[{ totalMedicines }]] = await pool.query('SELECT COUNT(*) AS totalMedicines FROM medicines WHERE is_active = 1');

    const [recentOrders] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5`
    );

    const [monthlyRevenue] = await pool.query(
      `SELECT MONTH(created_at) AS month, SUM(total_amount) AS revenue, COUNT(*) AS orders
       FROM orders
       WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
       GROUP BY MONTH(created_at)
       ORDER BY month ASC`
    );

    res.json({
      success: true,
      stats: { totalOrders, totalRevenue, pendingOrders, deliveredOrders, totalMedicines, recentOrders, monthlyRevenue },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus, getDashboardStats };

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const authRoutes     = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const orderRoutes    = require('./routes/orderRoutes');

// ─── Connect MySQL ────────────────────────────────────────────────
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Rate Limiting ────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } });

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'null'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));
app.use(limiter);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  success: true, message: '💊 Pharmora API (MySQL) is running!', version: '2.0.0',
  db: 'MySQL', endpoints: { auth: '/api/auth', medicines: '/api/medicines', orders: '/api/orders' },
}));
app.get('/api/health', (req, res) => res.json({ success: true, status: 'OK', db: 'MySQL', uptime: process.uptime() }));

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders',    orderRoutes);

// Legacy routes for backward compatibility
const { login, register } = require('./controllers/authController');
const { body } = require('express-validator');
app.post('/api/login',    authLimiter, [body('email').isEmail(), body('password').notEmpty()], login);
app.post('/api/register', authLimiter, [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })], register);

// ─── Error Handling ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         💊  PHARMORA BACKEND API             ║
╠══════════════════════════════════════════════╣
║  Status   : ✅ Running                       ║
║  Port     : ${PORT}                              ║
║  DB       : MySQL                            ║
╠══════════════════════════════════════════════╣
║  POST /api/auth/register  → Register         ║
║  POST /api/auth/login     → Login            ║
║  GET  /api/medicines      → List medicines   ║
║  POST /api/orders         → Place order      ║
║  GET  /api/orders/my      → My orders        ║
╚══════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err.message); server.close(() => process.exit(1)); });

module.exports = app;

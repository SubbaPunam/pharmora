const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, changePassword, getAllUsers, toggleUserStatus } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register',
  [body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email required'), body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')],
  register
);
router.post('/login',
  [body('email').isEmail().withMessage('Valid email required'), body('password').notEmpty().withMessage('Password required')],
  login
);
router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/users',            protect, adminOnly, getAllUsers);
router.put('/users/:id/status', protect, adminOnly, toggleUserStatus);

module.exports = router;

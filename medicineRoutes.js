const express = require('express');
const { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/',     getMedicines);
router.get('/:id',  getMedicineById);
router.post('/',    protect, adminOnly, createMedicine);
router.put('/:id',  protect, adminOnly, updateMedicine);
router.delete('/:id', protect, adminOnly, deleteMedicine);
module.exports = router;

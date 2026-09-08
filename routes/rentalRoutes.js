const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

router.get('/', verifyToken, rentalController.getAll);              // semua role (user hanya lihat miliknya)
router.get('/jadwal/:consoleId', verifyToken, rentalController.jadwalPerUnit); // jadwal booking 1 unit
router.post('/', verifyToken, rentalController.create);             // semua role yang sudah login
router.post('/:id/bayar', verifyToken, rentalController.tandaiSudahBayar);  // penyewa tandai sudah transfer
router.put('/:id/konfirmasi', verifyToken, checkRole('admin', 'superadmin'), rentalController.konfirmasiBayar); // admin konfirmasi
router.put('/:id/selesai', verifyToken, checkRole('admin', 'superadmin'), rentalController.finish);

module.exports = router;

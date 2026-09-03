const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

router.get('/', verifyToken, rentalController.getAll);              // semua role (user hanya lihat miliknya)
router.post('/', verifyToken, rentalController.create);             // semua role yang sudah login
router.put('/:id/selesai', verifyToken, checkRole('admin', 'superadmin'), rentalController.finish);

module.exports = router;

const express = require('express');
const router = express.Router();
const consoleController = require('../controllers/consoleController');
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

router.get('/', consoleController.getAll); // publik: lihat daftar konsol
router.post('/', verifyToken, checkRole('admin', 'superadmin'), consoleController.create);
router.put('/:id', verifyToken, checkRole('admin', 'superadmin'), consoleController.update);
router.delete('/:id', verifyToken, checkRole('admin', 'superadmin'), consoleController.remove);

module.exports = router;

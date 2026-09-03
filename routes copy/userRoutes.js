const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Semua endpoint di sini khusus superadmin
router.get('/', verifyToken, checkRole('superadmin'), userController.getAll);
router.put('/:id/role', verifyToken, checkRole('superadmin'), userController.updateRole);
router.delete('/:id', verifyToken, checkRole('superadmin'), userController.remove);

module.exports = router;

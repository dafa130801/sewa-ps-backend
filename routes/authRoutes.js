const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); // publik: daftar akun baru (selalu role "user")
router.post('/login', authController.login);        // publik: login

module.exports = router;

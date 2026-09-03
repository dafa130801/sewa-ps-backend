// =========================================
// CONTROLLER: AUTENTIKASI (REGISTER & LOGIN)
// =========================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Registrasi akun baru — SELALU dibuat dengan role "user"
// (role admin/superadmin hanya bisa diberikan lewat halaman Kelola User oleh superadmin)
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username sudah digunakan, coba yang lain.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashed, 'user']
    );

    res.status(201).json({ message: 'Akun berhasil dibuat. Silakan login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const user = rows[0];
    const cocok = await bcrypt.compare(password, user.password);
    if (!cocok) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// =========================================
// CONTROLLER: KELOLA AKUN USER (khusus superadmin)
// =========================================
const pool = require('../config/db');

// Ambil semua akun
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data user.' });
  }
};

// Ubah role seorang user (user / admin / superadmin)
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const rolesValid = ['user', 'admin', 'superadmin'];

    if (!rolesValid.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid.' });
    }

    // Cegah superadmin menurunkan role dirinya sendiri secara tidak sengaja
    if (parseInt(id) === req.user.id && role !== 'superadmin') {
      return res.status(400).json({ message: 'Anda tidak bisa mengubah role akun Anda sendiri.' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui role.' });
  }
};

// Hapus akun
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Anda tidak bisa menghapus akun Anda sendiri.' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Akun berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus akun.' });
  }
};

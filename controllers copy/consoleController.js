// =========================================
// CONTROLLER: MANAJEMEN UNIT KONSOL PS
// =========================================
const pool = require('../config/db');

// Ambil semua unit konsol
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consoles ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data konsol.' });
  }
};

// Tambah unit konsol baru
exports.create = async (req, res) => {
  try {
    const { nama, tipe, harga_per_jam } = req.body;
    if (!nama || !tipe || !harga_per_jam) {
      return res.status(400).json({ message: 'Nama, tipe, dan harga per jam wajib diisi.' });
    }
    const [result] = await pool.query(
      'INSERT INTO consoles (nama, tipe, harga_per_jam) VALUES (?, ?, ?)',
      [nama, tipe, harga_per_jam]
    );
    res.status(201).json({ message: 'Unit konsol berhasil ditambahkan.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menambahkan konsol.' });
  }
};

// Update unit konsol
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, tipe, harga_per_jam, status } = req.body;
    await pool.query(
      'UPDATE consoles SET nama = ?, tipe = ?, harga_per_jam = ?, status = ? WHERE id = ?',
      [nama, tipe, harga_per_jam, status, id]
    );
    res.json({ message: 'Unit konsol berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui konsol.' });
  }
};

// Hapus unit konsol
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM consoles WHERE id = ?', [id]);
    res.json({ message: 'Unit konsol berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus konsol.' });
  }
};

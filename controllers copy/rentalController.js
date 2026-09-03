// =========================================
// CONTROLLER: TRANSAKSI SEWA PS
// =========================================
const pool = require('../config/db');

// Ambil transaksi sewa
// - role user     : hanya melihat transaksi miliknya sendiri
// - role admin/superadmin : melihat semua transaksi
exports.getAll = async (req, res) => {
  try {
    let query = `
      SELECT r.*, c.nama AS nama_console, c.tipe
      FROM rentals r
      JOIN consoles c ON r.console_id = c.id
    `;
    const params = [];

    if (req.user.role === 'user') {
      query += ' WHERE r.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data transaksi.' });
  }
};

// Buat transaksi sewa baru (bisa dilakukan oleh role apapun yang sudah login)
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { console_id, no_hp, durasi_jam } = req.body;
    // Nama penyewa otomatis dari username jika tidak diisi manual
    const nama_penyewa = req.body.nama_penyewa || req.user.username;

    if (!console_id || !durasi_jam) {
      return res.status(400).json({ message: 'Console dan durasi wajib diisi.' });
    }

    await connection.beginTransaction();

    const [consoleRows] = await connection.query('SELECT * FROM consoles WHERE id = ? FOR UPDATE', [console_id]);
    if (consoleRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Unit konsol tidak ditemukan.' });
    }
    if (consoleRows[0].status !== 'tersedia') {
      await connection.rollback();
      return res.status(400).json({ message: 'Unit konsol sedang tidak tersedia.' });
    }

    const totalHarga = consoleRows[0].harga_per_jam * durasi_jam;
    const jamMulai = new Date();

    const [result] = await connection.query(
      'INSERT INTO rentals (console_id, user_id, nama_penyewa, no_hp, jam_mulai, durasi_jam, total_harga) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [console_id, req.user.id, nama_penyewa, no_hp || null, jamMulai, durasi_jam, totalHarga]
    );

    await connection.query('UPDATE consoles SET status = "disewa" WHERE id = ?', [console_id]);

    await connection.commit();
    res.status(201).json({ message: 'Transaksi sewa berhasil dibuat.', id: result.insertId, total_harga: totalHarga });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat transaksi sewa.' });
  } finally {
    connection.release();
  }
};

// Selesaikan sewa — khusus admin & superadmin (dibatasi lewat routes)
exports.finish = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [rentalRows] = await connection.query('SELECT * FROM rentals WHERE id = ?', [id]);
    if (rentalRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await connection.query('UPDATE rentals SET status = "selesai" WHERE id = ?', [id]);
    await connection.query('UPDATE consoles SET status = "tersedia" WHERE id = ?', [rentalRows[0].console_id]);

    await connection.commit();
    res.json({ message: 'Sewa telah diselesaikan. Unit kembali tersedia.' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Gagal menyelesaikan transaksi.' });
  } finally {
    connection.release();
  }
};

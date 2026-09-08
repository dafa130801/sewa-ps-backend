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
    const { console_id, no_hp, durasi_jam, jam_mulai } = req.body;
    // Nama penyewa otomatis dari username jika tidak diisi manual
    const nama_penyewa = req.body.nama_penyewa || req.user.username;

    if (!console_id || !durasi_jam || !jam_mulai) {
      return res.status(400).json({ message: 'Console, jam mulai, dan durasi wajib diisi.' });
    }

    await connection.beginTransaction();

    const [consoleRows] = await connection.query('SELECT * FROM consoles WHERE id = ? FOR UPDATE', [console_id]);
    if (consoleRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Unit konsol tidak ditemukan.' });
    }
    if (consoleRows[0].status === 'maintenance') {
      await connection.rollback();
      return res.status(400).json({ message: 'Unit konsol sedang maintenance.' });
    }

    // Cek bentrok jadwal: unit yang sama, rentang jam yang beririsan, dan belum selesai/batal
    const [bentrok] = await connection.query(
      `SELECT id FROM rentals
       WHERE console_id = ?
         AND status NOT IN ('selesai', 'batal')
         AND jam_mulai < DATE_ADD(?, INTERVAL ? HOUR)
         AND DATE_ADD(jam_mulai, INTERVAL durasi_jam HOUR) > ?`,
      [console_id, jam_mulai, durasi_jam, jam_mulai]
    );
    if (bentrok.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Unit ini sudah dipesan pada jam tersebut. Silakan pilih jam lain atau unit lain.' });
    }

    const totalHarga = consoleRows[0].harga_per_jam * durasi_jam;

    const [result] = await connection.query(
      'INSERT INTO rentals (console_id, user_id, nama_penyewa, no_hp, jam_mulai, durasi_jam, total_harga) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [console_id, req.user.id, nama_penyewa, no_hp || null, jam_mulai, durasi_jam, totalHarga]
    );

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

// Penyewa menandai sudah transfer (menunggu dicek admin)
exports.tandaiSudahBayar = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM rentals WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }
    if (req.user.role === 'user' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Anda tidak berhak mengakses transaksi ini.' });
    }

    await pool.query('UPDATE rentals SET payment_status = "menunggu_konfirmasi" WHERE id = ?', [id]);
    res.json({ message: 'Terima kasih, pembayaran Anda sedang menunggu konfirmasi admin.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menandai pembayaran.' });
  }
};

// Admin/superadmin konfirmasi pembayaran sudah diterima
exports.konfirmasiBayar = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM rentals WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await pool.query('UPDATE rentals SET payment_status = "lunas" WHERE id = ?', [id]);
    res.json({ message: 'Pembayaran telah dikonfirmasi lunas.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengkonfirmasi pembayaran.' });
  }
};
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

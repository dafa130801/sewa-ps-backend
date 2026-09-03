// =========================================
// SCRIPT UNTUK MEMBUAT AKUN AWAL (user, admin, superadmin)
// Jalankan dengan: npm run seed
// =========================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const akunAwal = [
  { username: 'superadmin', password: 'super123', role: 'superadmin' },
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' }
];

async function seed() {
  try {
    for (const akun of akunAwal) {
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [akun.username]);
      if (existing.length > 0) {
        console.log(`Akun "${akun.username}" sudah ada, dilewati.`);
        continue;
      }
      const hashed = await bcrypt.hash(akun.password, 10);
      await pool.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [akun.username, hashed, akun.role]
      );
      console.log(`Akun "${akun.username}" (role: ${akun.role}) berhasil dibuat.`);
    }

    console.log('\n=== Akun yang tersedia ===');
    akunAwal.forEach(a => console.log(`- ${a.role}: username="${a.username}", password="${a.password}"`));

    process.exit(0);
  } catch (err) {
    console.error('Gagal membuat akun:', err.message);
    process.exit(1);
  }
}

seed();

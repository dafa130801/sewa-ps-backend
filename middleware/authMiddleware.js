// =========================================
// MIDDLEWARE UNTUK VERIFIKASI TOKEN LOGIN (JWT)
// =========================================
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;

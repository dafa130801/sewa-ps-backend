// =========================================
// ENTRY POINT SERVER BACKEND (Express)
// =========================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const consoleRoutes = require('./routes/consoleRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/consoles', consoleRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/users', userRoutes);

// Route tes
app.get('/', (req, res) => {
  res.json({ message: 'API Sewa PS berjalan dengan baik 🎮' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

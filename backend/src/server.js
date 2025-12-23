require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bidderRoutes = require('./routes/bidderRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', bidderRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB(process.env.MONGO_URI);

  // Seed admin user
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log(`Seeded admin user with email: ${adminEmail}`);
    } else {
      console.log('Admin user already exists, skipping seeding');
    }
  } else {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Admin user not seeded.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});



require('dotenv').config();

let server;
let isShuttingDown = false;
let databaseReady = false;
let listenerReady = false;
let startupLogged = false;

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exitCode = 1;
  void shutdown('uncaughtException');
});

const cors = require('cors');
const express = require('express');
const path = require('path');
const prisma = require('./src/lib/prisma');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const canteenOrderRoutes = require('./routes/canteenOrderRoutes');
const ratingRoutes = require('./routes/rating.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');
const runnerRoutes = require('./routes/runner.routes');
const searchRoutes = require('./routes/search.routes');
const uploadRoutes = require('./routes/upload.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const port = Number(process.env.PORT) || 5001;
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
]);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://127.0.0.1:4174');
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET harus diatur dan memiliki panjang minimal 32 karakter.');
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin tidak diizinkan oleh CORS: ${origin}`));
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((_req, res, next) => {
  if (!databaseReady) {
    return res.status(503).json({ error: 'Database belum siap.' });
  }
  return next();
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/runner', runnerRoutes);
app.use('/api/canteens', menuRoutes);
app.use('/api/canteen', canteenOrderRoutes);
app.use('/api/canteens', ratingRoutes);
app.use('/api/orders', orderRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});
app.use(errorHandler);

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received; shutting down GoCan API.`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error while shutting down GoCan API:', error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

function logStartupReady() {
  if (databaseReady && listenerReady && !startupLogged) {
    startupLogged = true;
    console.log(`GoCan API listening on http://localhost:${port}`);
  }
}

prisma
  .$connect()
  .then(() => {
    databaseReady = true;
    logStartupReady();
  })
  .catch(async (error) => {
    console.error('Could not connect to the SQLite database:', error);
    process.exitCode = 1;
    await shutdown('database connection failure');
  });

server = app.listen(port);
server.on('listening', () => {
  listenerReady = true;
  logStartupReady();
});
server.on('error', (error) => {
  console.error('GoCan API listener error:', error);
  process.exitCode = 1;
  void shutdown('listener error');
});
server.on('close', () => {
  console.error('GoCan API listener closed.');
});

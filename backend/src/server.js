import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB, { disconnectDB } from './config/db.js';
import { runSeed } from './utils/seedData.js';
import { cleanupDemoData } from './utils/cleanupDemoData.js';
import User from './models/User.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.CLEAN_DEMO_ON_START === 'true') {
      await cleanupDemoData();
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await runSeed();
    }

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_URL,
          process.env.ADMIN_URL,
          'http://localhost:5173',
          'http://localhost:5174',
        ],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
      });
    });

    app.set('io', io);

    server.listen(PORT, () => {
      console.log(`🚀 DHA Housing Scheme API running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} already in use. Run: npx kill-port ${PORT}`);
        process.exit(1);
      }
      throw err;
    });

    const shutdown = async (signal, stopMongo = true) => {
      console.log(`\n${signal} — closing server...`);
      server.close(async () => {
        await disconnectDB(stopMongo);
        if (signal === 'SIGUSR2') {
          process.kill(process.pid, 'SIGUSR2');
        } else {
          process.exit(0);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT', true));
    process.on('SIGTERM', () => shutdown('SIGTERM', true));
    process.once('SIGUSR2', () => shutdown('SIGUSR2', false));
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

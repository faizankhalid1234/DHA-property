import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import os from 'os';

let memoryServer = null;
export let dbMode = 'unknown';

const PERSISTENT_DB_PATH =
  process.env.PERSISTENT_DB_PATH ||
  path.join(process.env.LOCALAPPDATA || os.homedir(), 'dha-housing-scheme', 'mongodb-data');

const PERSISTENT_MONGO_PORT = Number(process.env.PERSISTENT_MONGO_PORT || 27018);
const PERSISTENT_MONGO_URI = `mongodb://127.0.0.1:${PERSISTENT_MONGO_PORT}/dha-housing`;

const buildFallbackUri = (uri) => {
  if (!uri.includes('mongodb+srv://')) return null;

  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?/);
  if (!match) return null;

  const [, user, pass, host, dbPath = '/dha-housing', params = ''] = match;
  const query = params || '?retryWrites=true&w=majority';
  const sslQuery = query.includes('ssl=') ? query : `${query}&ssl=true&authSource=admin`;

  return `mongodb://${user}:${pass}@${host}:27017${dbPath}${sslQuery}`;
};

const tryConnect = async (connectionUri, options = {}, mode = 'remote') => {
  await mongoose.connect(connectionUri, options);
  dbMode = mode;
  console.log(`✅ MongoDB Connected (${mode}): ${mongoose.connection.name} @ ${mongoose.connection.host}`);
  return mode;
};

const removeStaleLock = (dbPath) => {
  const lockPath = path.join(dbPath, 'mongod.lock');
  if (!fs.existsSync(lockPath)) return;

  try {
    fs.unlinkSync(lockPath);
    console.warn('⚠️  Removed stale MongoDB lock file');
  } catch {
    // Another live mongod process owns the lock — reuse that instance below
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectPersistentUri = async (timeoutMs = 3000) =>
  tryConnect(PERSISTENT_MONGO_URI, { serverSelectionTimeoutMS: timeoutMs }, 'persistent-local');

const connectPersistentWithRetry = async (attempts = 5, delayMs = 1500) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await connectPersistentUri(3000);
    } catch {
      if (i < attempts - 1) await sleep(delayMs);
    }
  }
  throw new Error('Could not connect to persistent local database');
};

const startPersistentLocalDb = async () => {
  fs.mkdirSync(PERSISTENT_DB_PATH, { recursive: true });

  try {
    return await connectPersistentWithRetry(3);
  } catch {
    // Not running yet — may need to wait for another backend instance or start fresh
  }

  const lockPath = path.join(PERSISTENT_DB_PATH, 'mongod.lock');
  if (fs.existsSync(lockPath)) {
    try {
      return await connectPersistentWithRetry(10, 1000);
    } catch {
      removeStaleLock(PERSISTENT_DB_PATH);
    }
  } else {
    removeStaleLock(PERSISTENT_DB_PATH);
  }

  try {
    return await connectPersistentWithRetry(2);
  } catch {
    // continue to start embedded mongod
  }

  console.warn('📦 Starting persistent local database...');
  console.warn(`   Data folder: ${PERSISTENT_DB_PATH}`);
  console.warn(`   Port: ${PERSISTENT_MONGO_PORT}`);

  try {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'dha-housing',
        dbPath: PERSISTENT_DB_PATH,
        port: PERSISTENT_MONGO_PORT,
      },
    });

    return await connectPersistentUri(5000);
  } catch (error) {
    try {
      return await connectPersistentWithRetry(5, 1000);
    } catch {
      console.error(`❌ Could not start persistent database: ${error.message}`);
      console.error('   Close other backend terminals and try again.');
      process.exit(1);
    }
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env file');
    process.exit(1);
  }

  const isAtlas = uri.includes('mongodb.net');
  const options = { serverSelectionTimeoutMS: isAtlas ? 15000 : 5000 };

  try {
    return await tryConnect(uri, options, 'atlas');
  } catch (error) {
    const fallbackUri = buildFallbackUri(uri);

    if (fallbackUri && uri.includes('mongodb+srv://')) {
      console.warn(`⚠️  SRV failed (${error.message}). Trying standard URI...`);
      try {
        await mongoose.disconnect().catch(() => {});
        return await tryConnect(fallbackUri, options, 'atlas');
      } catch (fallbackError) {
        console.warn(`⚠️  Atlas failed (${fallbackError.message})`);
      }
    }

    const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/dha-housing';
    try {
      await mongoose.disconnect().catch(() => {});
      console.warn('⚠️  Trying local MongoDB...');
      return await tryConnect(localUri, { serverSelectionTimeoutMS: 3000 }, 'local');
    } catch {
      // continue to persistent fallback
    }

    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }

    await mongoose.disconnect().catch(() => {});
    return startPersistentLocalDb();
  }
};

export const disconnectDB = async (stopMongoProcess = true) => {
  await mongoose.disconnect().catch(() => {});
  if (stopMongoProcess && memoryServer) {
    await memoryServer.stop().catch(() => {});
    memoryServer = null;
  }
};

export default connectDB;

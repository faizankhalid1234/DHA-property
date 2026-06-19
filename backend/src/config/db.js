import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

const buildFallbackUri = (uri) => {
  if (!uri.includes('mongodb+srv://')) return null;

  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?/);
  if (!match) return null;

  const [, user, pass, host, dbPath = '/dha-housing', params = ''] = match;
  const query = params || '?retryWrites=true&w=majority';
  const sslQuery = query.includes('ssl=') ? query : `${query}&ssl=true&authSource=admin`;

  return `mongodb://${user}:${pass}@${host}:27017${dbPath}${sslQuery}`;
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env file');
    process.exit(1);
  }

  const isAtlas = uri.includes('mongodb.net');
  const options = { serverSelectionTimeoutMS: isAtlas ? 15000 : 5000 };

  const tryConnect = async (connectionUri) => {
    await mongoose.connect(connectionUri, options);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
    return false;
  };

  const startMemoryDb = async () => {
    console.warn('📦 Using in-memory database (development fallback)...');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri('dha-housing');
    await mongoose.connect(memoryUri);
    console.log('✅ In-memory MongoDB ready — login/signup will work locally');
    console.log('   Tip: Whitelist your IP in MongoDB Atlas to use cloud database');
    return true;
  };

  try {
    return await tryConnect(uri);
  } catch (error) {
    const fallbackUri = buildFallbackUri(uri);

    if (fallbackUri && uri.includes('mongodb+srv://')) {
      console.warn(`⚠️  SRV failed (${error.message}). Trying standard URI...`);
      try {
        await mongoose.disconnect().catch(() => {});
        return await tryConnect(fallbackUri);
      } catch (fallbackError) {
        if (process.env.NODE_ENV === 'development') {
          return startMemoryDb();
        }
        console.error(`❌ MongoDB Atlas failed: ${fallbackError.message}`);
        process.exit(1);
      }
    }

    if (isAtlas && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  Atlas unavailable (${error.message})`);
      return startMemoryDb();
    }

    if (isAtlas || process.env.NODE_ENV === 'production') {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }

    return startMemoryDb();
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

export default connectDB;

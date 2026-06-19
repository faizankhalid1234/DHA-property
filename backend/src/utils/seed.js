import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { runSeed } from './seedData.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await runSeed({ reset: true });
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

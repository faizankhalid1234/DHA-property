import User from '../models/User.js';
import Block from '../models/Block.js';

export const runSeed = async ({ reset = false } = {}) => {
  const userCount = await User.countDocuments();
  if (userCount > 0 && !reset) {
    console.log('ℹ️  Database already has data, skipping seed.');
    return;
  }

  if (reset) {
    await Promise.all([
      User.deleteMany(),
      Block.deleteMany(),
    ]);
  }

  console.log('🌱 Seeding database (admin accounts + blocks only)...');

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@dha.com',
    password: 'Admin@123',
    role: 'super_admin',
    phone: '03001234567',
  });

  await User.create({
    name: 'DHA Admin',
    email: 'dhaadmin@dha.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '03001234568',
  });

  await Block.insertMany([
    { name: 'Block A', sector: 'Sector 1', description: 'Residential Block A', createdBy: superAdmin._id },
    { name: 'Block B', sector: 'Sector 2', description: 'Residential Block B', createdBy: superAdmin._id },
    { name: 'Executive Block', sector: 'Sector 3', description: 'Premium Executive Block', createdBy: superAdmin._id },
    { name: 'Overseas Block', sector: 'Sector 4', description: 'Overseas Pakistanis Block', createdBy: superAdmin._id },
    { name: 'Commercial Block', sector: 'Sector 5', description: 'Commercial Properties', createdBy: superAdmin._id },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('   Super Admin: admin@dha.com / Admin@123');
  console.log('   Admin:       dhaadmin@dha.com / Admin@123');
};

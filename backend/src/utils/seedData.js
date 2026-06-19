import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Block from '../models/Block.js';
import Property from '../models/Property.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import OwnershipPeriod from '../models/OwnershipPeriod.js';
import { generatePropertyQR } from './qrcode.js';

export const runSeed = async ({ reset = false } = {}) => {
  const userCount = await User.countDocuments();
  if (userCount > 0 && !reset) {
    console.log('ℹ️  Database already has data, skipping seed.');
    return;
  }

  if (reset) {
    await Promise.all([
      User.deleteMany(),
      Customer.deleteMany(),
      Block.deleteMany(),
      Property.deleteMany(),
      OwnershipHistory.deleteMany(),
    ]);
  }

  console.log('🌱 Seeding database...');

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

  const blocks = await Block.insertMany([
    { name: 'Block A', sector: 'Sector 1', description: 'Residential Block A', createdBy: superAdmin._id },
    { name: 'Block B', sector: 'Sector 2', description: 'Residential Block B', createdBy: superAdmin._id },
    { name: 'Executive Block', sector: 'Sector 3', description: 'Premium Executive Block', createdBy: superAdmin._id },
    { name: 'Overseas Block', sector: 'Sector 4', description: 'Overseas Pakistanis Block', createdBy: superAdmin._id },
    { name: 'Commercial Block', sector: 'Sector 5', description: 'Commercial Properties', createdBy: superAdmin._id },
  ]);

  const customer1 = await Customer.create({
    fullName: 'Ahmed Khan',
    fatherName: 'Muhammad Khan',
    cnic: '42101-1234567-1',
    phone: '03001234569',
    email: 'ahmed@example.com',
    address: 'House 123, Karachi',
    isVerified: true,
    createdBy: superAdmin._id,
  });

  const customerUser1 = await User.create({
    name: 'Ahmed Khan',
    email: 'ahmed@example.com',
    password: 'Customer@123',
    role: 'customer',
    phone: '03001234569',
    customerRef: customer1._id,
  });
  customer1.user = customerUser1._id;
  await customer1.save();

  const customer2 = await Customer.create({
    fullName: 'Fatima Ali',
    fatherName: 'Hassan Ali',
    cnic: '42101-7654321-2',
    phone: '03001234570',
    email: 'fatima@example.com',
    address: 'House 456, Lahore',
    isVerified: true,
    createdBy: superAdmin._id,
  });

  const customerUser2 = await User.create({
    name: 'Fatima Ali',
    email: 'fatima@example.com',
    password: 'Customer@123',
    role: 'customer',
    phone: '03001234570',
    customerRef: customer2._id,
  });
  customer2.user = customerUser2._id;
  await customer2.save();

  const propertiesData = [
    {
      propertyId: 'DHA-000001',
      propertyNumber: 'A-101',
      propertyType: 'plot',
      block: blocks[0]._id,
      blockName: 'Block A',
      sectorName: 'Sector 1',
      plotSize: '10 Marla',
      width: 30,
      length: 75,
      totalArea: 2250,
      price: 8500000,
      status: 'active',
      statusLocked: true,
      marketStatus: 'owned',
      currentOwner: customer1._id,
      ownerName: customer1.fullName,
      purchaseDate: new Date('2023-06-15'),
      ownershipDetails: 'Original allotment',
      isFeatured: true,
      description: 'Prime location plot in Block A with excellent road access.',
      createdBy: superAdmin._id,
    },
    {
      propertyId: 'DHA-000002',
      propertyNumber: 'A-102',
      propertyType: 'plot',
      block: blocks[0]._id,
      blockName: 'Block A',
      sectorName: 'Sector 1',
      plotSize: '5 Marla',
      width: 25,
      length: 45,
      totalArea: 1125,
      price: 4500000,
      status: 'pending',
      statusLocked: true,
      marketStatus: 'available',
      isFeatured: true,
      description: 'Available 5 Marla plot ready for construction.',
      createdBy: superAdmin._id,
    },
    {
      propertyId: 'DHA-000003',
      propertyNumber: 'EB-201',
      propertyType: 'house',
      block: blocks[2]._id,
      blockName: 'Executive Block',
      sectorName: 'Sector 3',
      plotSize: '1 Kanal',
      width: 50,
      length: 90,
      totalArea: 4500,
      price: 35000000,
      status: 'active',
      statusLocked: true,
      marketStatus: 'owned',
      currentOwner: customer2._id,
      ownerName: customer2.fullName,
      purchaseDate: new Date('2024-01-20'),
      ownershipDetails: 'Executive house with modern amenities',
      isFeatured: true,
      amenities: ['Swimming Pool', 'Garden', 'Garage', 'Security'],
      description: 'Luxury executive house with premium finishes.',
      createdBy: superAdmin._id,
    },
  ];

  for (const propData of propertiesData) {
    const property = await Property.create(propData);
    property.qrCode = await generatePropertyQR(property);
    await property.save();

    if (property.currentOwner) {
      await Customer.findByIdAndUpdate(property.currentOwner, {
        $push: { properties: property._id },
      });
      const owner = await Customer.findById(property.currentOwner);
      await OwnershipHistory.create({
        property: property._id,
        customer: property.currentOwner,
        ownerName: owner.fullName,
        ownerCnic: owner.cnic,
        action: 'assigned',
        details: 'Initial seed assignment',
        status: property.status,
        performedBy: superAdmin._id,
      });
      await OwnershipPeriod.create({
        property: property._id,
        customer: property.currentOwner,
        propertyNumber: property.propertyNumber,
        blockName: property.blockName,
        sectorName: property.sectorName,
        propertyType: property.propertyType,
        startDate: property.purchaseDate || new Date(),
        isCurrent: true,
        role: 'owner',
      });
    } else {
      property.marketStatus = property.marketStatus || 'available';
      property.statusLocked = true;
      await property.save();
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('   Super Admin: admin@dha.com / Admin@123');
  console.log('   Customer:    ahmed@example.com / Customer@123');
};

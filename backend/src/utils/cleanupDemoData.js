import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Property from '../models/Property.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import OwnershipPeriod from '../models/OwnershipPeriod.js';
import SaleRequest from '../models/SaleRequest.js';
import Transfer from '../models/Transfer.js';

const DEMO_PROPERTY_IDS = ['DHA-000001', 'DHA-000002', 'DHA-000003'];
const DEMO_CUSTOMER_EMAILS = ['ahmed@example.com', 'fatima@example.com'];

export const cleanupDemoData = async () => {
  const demoProperties = await Property.find({ propertyId: { $in: DEMO_PROPERTY_IDS } }).select('_id');
  const propertyIds = demoProperties.map((p) => p._id);

  const demoCustomers = await Customer.find({ email: { $in: DEMO_CUSTOMER_EMAILS } }).select('_id user');
  const customerIds = demoCustomers.map((c) => c._id);
  const demoUserIds = demoCustomers.map((c) => c.user).filter(Boolean);

  if (propertyIds.length === 0 && customerIds.length === 0) {
    return { removedProperties: 0, removedCustomers: 0 };
  }

  await Promise.all([
    OwnershipHistory.deleteMany({ $or: [{ property: { $in: propertyIds } }, { customer: { $in: customerIds } }] }),
    OwnershipPeriod.deleteMany({ $or: [{ property: { $in: propertyIds } }, { customer: { $in: customerIds } }] }),
    SaleRequest.deleteMany({ $or: [{ property: { $in: propertyIds } }, { seller: { $in: customerIds } }, { buyer: { $in: customerIds } }] }),
    Transfer.deleteMany({ $or: [{ property: { $in: propertyIds } }, { previousOwner: { $in: customerIds } }, { newOwner: { $in: customerIds } }] }),
  ]);

  if (propertyIds.length) {
    await Customer.updateMany({}, { $pull: { properties: { $in: propertyIds } } });
    await Property.deleteMany({ _id: { $in: propertyIds } });
  }

  if (customerIds.length) {
    await Property.updateMany({ currentOwner: { $in: customerIds } }, {
      $unset: { currentOwner: 1, ownerName: 1, purchaseDate: 1 },
      marketStatus: 'available',
    });
    await Customer.deleteMany({ _id: { $in: customerIds } });
  }

  if (demoUserIds.length) {
    await User.deleteMany({ _id: { $in: demoUserIds } });
  }

  console.log(`🧹 Demo data removed: ${propertyIds.length} properties, ${customerIds.length} customers`);
  return { removedProperties: propertyIds.length, removedCustomers: customerIds.length };
};

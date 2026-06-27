import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import SaleRequest from '../models/SaleRequest.js';
import OwnershipPeriod from '../models/OwnershipPeriod.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import Transfer from '../models/Transfer.js';
import Case from '../models/Case.js';
import Document from '../models/Document.js';
import { blockPropertyFilter } from './blockStats.js';

export async function deletePropertyFully(propertyId) {
  const property = await Property.findById(propertyId);
  if (!property) return null;

  const blockId = property.block;

  await Promise.all([
    SaleRequest.deleteMany({ property: propertyId }),
    OwnershipPeriod.deleteMany({ property: propertyId }),
    OwnershipHistory.deleteMany({ property: propertyId }),
    Transfer.deleteMany({ property: propertyId }),
    Case.deleteMany({ property: propertyId }),
    Document.deleteMany({ property: propertyId }),
    Customer.updateMany({}, { $pull: { properties: propertyId } }),
  ]);

  await property.deleteOne();
  return blockId;
}

export async function deleteAllPropertiesForBlock(block) {
  const properties = await Property.find(blockPropertyFilter(block)).select('_id');
  for (const { _id } of properties) {
    await deletePropertyFully(_id);
  }
  return properties.length;
}

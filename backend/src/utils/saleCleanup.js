import SaleRequest from '../models/SaleRequest.js';
import Property from '../models/Property.js';

export async function cancelPendingSalesForProperty(propertyId, processedBy = null) {
  const property = await Property.findById(propertyId);
  if (!property) return 0;

  const result = await SaleRequest.updateMany(
    { property: propertyId, status: 'pending' },
    {
      status: 'rejected',
      processedAt: new Date(),
      ...(processedBy ? { processedBy } : {}),
    }
  );

  if (property.marketStatus === 'sale_pending' || property.activeSaleRequest) {
    property.marketStatus = property.currentOwner ? 'owned' : 'available';
    property.activeSaleRequest = null;
    await property.save();
  }

  return result.modifiedCount;
}

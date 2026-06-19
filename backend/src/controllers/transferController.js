import Transfer from '../models/Transfer.js';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import OwnershipPeriod from '../models/OwnershipPeriod.js';
import { asyncHandler } from '../middleware/validate.js';
import { createNotification } from '../utils/notifications.js';

const generateTransferNumber = async () => {
  const count = await Transfer.countDocuments();
  return `TRF-${String(count + 1).padStart(6, '0')}`;
};

export const getTransfers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [transfers, total] = await Promise.all([
    Transfer.find()
      .populate('property', 'propertyNumber blockName sectorName')
      .populate('previousOwner', 'fullName cnic')
      .populate('newOwner', 'fullName cnic')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Transfer.countDocuments(),
  ]);
  res.json({
    success: true,
    data: transfers,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getTransfer = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id)
    .populate('property')
    .populate('previousOwner')
    .populate('newOwner')
    .populate('documents')
    .populate('performedBy', 'name email');
  if (!transfer) {
    return res.status(404).json({ success: false, message: 'Transfer not found' });
  }
  res.json({ success: true, data: transfer });
});

export const createTransfer = asyncHandler(async (req, res) => {
  const { propertyId, newOwnerId, transferReason, notes, transferDate } = req.body;

  const property = await Property.findById(propertyId).populate('currentOwner');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  if (!property.currentOwner) {
    return res.status(400).json({ success: false, message: 'Property has no current owner' });
  }

  const newOwner = await Customer.findById(newOwnerId);
  if (!newOwner) {
    return res.status(404).json({ success: false, message: 'New owner not found' });
  }

  const previousOwner = property.currentOwner;
  const transferNumber = await generateTransferNumber();
  const saleDate = transferDate ? new Date(transferDate) : new Date();

  await OwnershipPeriod.findOneAndUpdate(
    { property: propertyId, customer: previousOwner._id, isCurrent: true },
    { endDate: saleDate, isCurrent: false, role: 'seller' }
  );

  await OwnershipPeriod.create({
    property: propertyId,
    customer: newOwnerId,
    propertyNumber: property.propertyNumber,
    blockName: property.blockName,
    sectorName: property.sectorName,
    propertyType: property.propertyType,
    startDate: saleDate,
    isCurrent: true,
    role: 'owner',
  });

  const transfer = await Transfer.create({
    property: propertyId,
    previousOwner: previousOwner._id,
    previousOwnerName: previousOwner.fullName,
    previousOwnerCnic: previousOwner.cnic || '',
    newOwner: newOwnerId,
    newOwnerName: newOwner.fullName,
    newOwnerCnic: newOwner.cnic || '',
    transferDate: saleDate,
    transferReason,
    notes,
    performedBy: req.user._id,
    transferNumber,
  });

  await OwnershipHistory.create({
    property: propertyId,
    customer: newOwnerId,
    ownerName: newOwner.fullName,
    ownerCnic: newOwner.cnic || '',
    action: 'transferred',
    previousOwner: previousOwner._id,
    previousOwnerName: previousOwner.fullName,
    details: `Transferred from ${previousOwner.fullName} to ${newOwner.fullName}. ${transferReason || ''}`,
    status: property.status,
    performedBy: req.user._id,
    metadata: { transferId: transfer._id, transferNumber },
  });

  await Customer.findByIdAndUpdate(previousOwner._id, {
    $pull: { properties: propertyId },
  });
  await Customer.findByIdAndUpdate(newOwnerId, {
    $addToSet: { properties: propertyId },
  });

  property.currentOwner = newOwnerId;
  property.ownerName = newOwner.fullName;
  property.marketStatus = 'owned';
  property.activeSaleRequest = null;
  await property.save();

  const notifyUsers = [previousOwner.user, newOwner.user].filter(Boolean);
  for (const userId of notifyUsers) {
    await createNotification({
      recipientId: userId,
      title: 'Property Transferred',
      message: `Property ${property.propertyNumber} transfer ${transferNumber} has been recorded.`,
      type: 'property_transferred',
      relatedModel: 'Transfer',
      relatedId: transfer._id,
    });
  }

  res.status(201).json({ success: true, data: transfer });
});

export const getCustomerTransfers = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) {
    return res.json({ success: true, data: [] });
  }

  const transfers = await Transfer.find({
    $or: [{ previousOwner: customer._id }, { newOwner: customer._id }],
  })
    .populate('property', 'propertyNumber blockName')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: transfers });
});

export const getPropertyTransferHistory = asyncHandler(async (req, res) => {
  const transfers = await Transfer.find({ property: req.params.propertyId })
    .populate('previousOwner', 'fullName cnic')
    .populate('newOwner', 'fullName cnic')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: transfers });
});

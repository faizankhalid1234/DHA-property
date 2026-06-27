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
  return res.status(403).json({
    success: false,
    message: 'Manual ownership transfer is disabled. Use Property Sales to approve or create sale requests.',
  });
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

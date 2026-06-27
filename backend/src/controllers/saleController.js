import SaleRequest from '../models/SaleRequest.js';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import OwnershipPeriod from '../models/OwnershipPeriod.js';
import Transfer from '../models/Transfer.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import { asyncHandler } from '../middleware/validate.js';
import { createNotification } from '../utils/notifications.js';
import { canSellOrBuy, statusMessage } from '../utils/propertyStatus.js';

const generateRequestNumber = async () => {
  const count = await SaleRequest.countDocuments();
  return `SALE-${String(count + 1).padStart(6, '0')}`;
};

const generateTransferNumber = async () => {
  const count = await Transfer.countDocuments();
  return `TRF-${String(count + 1).padStart(6, '0')}`;
};

export const getSaleRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const requests = await SaleRequest.find(filter)
    .populate('property', 'propertyNumber blockName sectorName propertyType status')
    .populate('seller', 'fullName cnic phone email')
    .populate('buyer', 'fullName cnic phone email')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
});

export const getMySaleRequests = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) return res.json({ success: true, data: [] });

  const requests = await SaleRequest.find({
    $or: [{ seller: customer._id }, { buyer: customer._id }],
  })
    .populate('property', 'propertyNumber blockName sectorName propertyType status marketStatus')
    .populate('seller', 'fullName cnic')
    .populate('buyer', 'fullName cnic')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

export const createSaleRequest = asyncHandler(async (req, res) => {
  const { propertyId, notes } = req.body;
  const buyer = await Customer.findOne({ user: req.user._id });
  if (!buyer) {
    return res.status(404).json({ success: false, message: 'Customer profile not found' });
  }

  const property = await Property.findById(propertyId).populate('currentOwner');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  if (!property.currentOwner) {
    return res.status(400).json({ success: false, message: 'Property has no owner to buy from' });
  }

  const saleRequest = await initiateSaleRequest({
    property,
    seller: property.currentOwner,
    buyer,
    requestedBy: 'buyer',
    notes,
  });

  res.status(201).json({ success: true, data: saleRequest });
});

const initiateSaleRequest = async ({ property, seller, buyer, requestedBy, notes }) => {
  const ownerId = (property.currentOwner?._id || property.currentOwner)?.toString();
  if (!ownerId || ownerId !== seller._id.toString()) {
    const err = new Error('Only the current owner can sell this property');
    err.status = 400;
    throw err;
  }
  if (seller._id.toString() === buyer._id.toString()) {
    const err = new Error('Buyer cannot be the same as seller');
    err.status = 400;
    throw err;
  }
  if (property.marketStatus === 'sale_pending') {
    const err = new Error('Sale already pending for this property');
    err.status = 400;
    throw err;
  }
  if (!canSellOrBuy(property.status)) {
    const err = new Error(statusMessage(property.status, 'complete this sale'));
    err.status = 400;
    throw err;
  }

  const requestNumber = await generateRequestNumber();
  const saleRequest = await SaleRequest.create({
    requestNumber,
    property: property._id,
    seller: seller._id,
    sellerName: seller.fullName,
    buyer: buyer._id,
    buyerName: buyer.fullName,
    requestedBy,
    notes: notes || '',
  });

  property.marketStatus = 'sale_pending';
  property.activeSaleRequest = saleRequest._id;
  await property.save();

  const sellerUser = seller.user || (await Customer.findById(seller._id).select('user'))?.user;
  const buyerUser = buyer.user || (await Customer.findById(buyer._id).select('user'))?.user;
  for (const userId of [sellerUser, buyerUser].filter(Boolean)) {
    await createNotification({
      recipientId: userId,
      title: 'Property Sale Request',
      message: `Sale request ${requestNumber} for ${property.propertyNumber} (${property.blockName}). Seller: ${seller.fullName}, Buyer: ${buyer.fullName}. Awaiting admin approval.`,
      type: 'general',
      relatedModel: 'Property',
      relatedId: property._id,
    });
  }

  return saleRequest;
};

export const createSellerSale = asyncHandler(async (req, res) => {
  const { propertyId, buyerEmail, notes } = req.body;
  if (!propertyId || !buyerEmail?.trim()) {
    return res.status(400).json({ success: false, message: 'Property and buyer email are required' });
  }

  const seller = await Customer.findOne({ user: req.user._id });
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Customer profile not found' });
  }

  const buyer = await Customer.findOne({ email: buyerEmail.trim().toLowerCase() });
  if (!buyer) {
    return res.status(404).json({
      success: false,
      message: 'Buyer not found. Ask admin to add the buyer as a customer with this email first.',
    });
  }

  const property = await Property.findById(propertyId).populate('currentOwner');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  const saleRequest = await initiateSaleRequest({
    property,
    seller,
    buyer,
    requestedBy: 'seller',
    notes,
  });

  res.status(201).json({ success: true, data: saleRequest });
});

export const createAdminSale = asyncHandler(async (req, res) => {
  const { propertyId, buyerId, notes } = req.body;
  if (!propertyId || !buyerId) {
    return res.status(400).json({ success: false, message: 'Property and buyer are required' });
  }

  const property = await Property.findById(propertyId).populate('currentOwner');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  if (!property.currentOwner) {
    return res.status(400).json({ success: false, message: 'Property has no owner to sell from' });
  }

  const buyer = await Customer.findById(buyerId);
  if (!buyer) {
    return res.status(404).json({ success: false, message: 'Buyer customer not found' });
  }

  const saleRequest = await initiateSaleRequest({
    property,
    seller: property.currentOwner,
    buyer,
    requestedBy: 'admin',
    notes,
  });

  res.status(201).json({ success: true, data: saleRequest });
});

export const approveSaleRequest = asyncHandler(async (req, res) => {
  const { saleDate, notes } = req.body;
  const saleRequest = await SaleRequest.findById(req.params.id)
    .populate({ path: 'property' })
    .populate({ path: 'seller', populate: { path: 'user' } })
    .populate({ path: 'buyer', populate: { path: 'user' } });

  if (!saleRequest) {
    return res.status(404).json({ success: false, message: 'Sale request not found' });
  }
  if (saleRequest.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Sale request already processed' });
  }

  const property = saleRequest.property;
  if (!canSellOrBuy(property.status)) {
    return res.status(400).json({
      success: false,
      message: statusMessage(property.status, 'approve this sale'),
    });
  }

  const transferDate = saleDate ? new Date(saleDate) : new Date();
  const transferNumber = await generateTransferNumber();

  await OwnershipPeriod.findOneAndUpdate(
    { property: property._id, customer: saleRequest.seller._id, isCurrent: true },
    { endDate: transferDate, isCurrent: false, role: 'seller' }
  );

  const transfer = await Transfer.create({
    property: property._id,
    previousOwner: saleRequest.seller._id,
    previousOwnerName: saleRequest.sellerName,
    previousOwnerCnic: saleRequest.seller.cnic || '',
    newOwner: saleRequest.buyer._id,
    newOwnerName: saleRequest.buyerName,
    newOwnerCnic: saleRequest.buyer.cnic || '',
    transferDate,
    transferReason: notes || `Sale approved - ${saleRequest.requestNumber}`,
    performedBy: req.user._id,
    transferNumber,
  });

  await OwnershipPeriod.create({
    property: property._id,
    customer: saleRequest.buyer._id,
    propertyNumber: property.propertyNumber,
    blockName: property.blockName,
    sectorName: property.sectorName,
    propertyType: property.propertyType,
    startDate: transferDate,
    isCurrent: true,
    role: 'owner',
    transfer: transfer._id,
  });

  await OwnershipHistory.create({
    property: property._id,
    customer: saleRequest.buyer._id,
    ownerName: saleRequest.buyerName,
    ownerCnic: saleRequest.buyer.cnic || '',
    action: 'transferred',
    previousOwner: saleRequest.seller._id,
    previousOwnerName: saleRequest.sellerName,
    details: `Sale completed. ${saleRequest.sellerName} sold to ${saleRequest.buyerName} on ${transferDate.toLocaleDateString()}`,
    status: property.status,
    performedBy: req.user._id,
    metadata: { transferId: transfer._id, saleRequestId: saleRequest._id },
  });

  await Customer.findByIdAndUpdate(saleRequest.seller._id, { $pull: { properties: property._id } });
  await Customer.findByIdAndUpdate(saleRequest.buyer._id, { $addToSet: { properties: property._id } });

  property.currentOwner = saleRequest.buyer._id;
  property.ownerName = saleRequest.buyerName;
  property.purchaseDate = transferDate;
  property.marketStatus = 'owned';
  property.activeSaleRequest = null;
  await property.save();

  saleRequest.status = 'completed';
  saleRequest.saleDate = transferDate;
  saleRequest.processedBy = req.user._id;
  saleRequest.processedAt = new Date();
  await saleRequest.save();

  for (const userId of [saleRequest.seller.user, saleRequest.buyer.user].filter(Boolean)) {
    await createNotification({
      recipientId: userId,
      title: 'Property Sale Completed',
      message: `Property ${property.propertyNumber} transfer completed. New owner: ${saleRequest.buyerName}`,
      type: 'property_transferred',
      relatedModel: 'Transfer',
      relatedId: transfer._id,
    });
  }

  res.json({ success: true, data: { saleRequest, transfer } });
});

export const rejectSaleRequest = asyncHandler(async (req, res) => {
  const saleRequest = await SaleRequest.findById(req.params.id).populate('property');
  if (!saleRequest) {
    return res.status(404).json({ success: false, message: 'Sale request not found' });
  }

  saleRequest.status = 'rejected';
  saleRequest.processedBy = req.user._id;
  saleRequest.processedAt = new Date();
  await saleRequest.save();

  if (saleRequest.property) {
    await Property.findByIdAndUpdate(saleRequest.property._id, {
      marketStatus: 'owned',
      activeSaleRequest: null,
    });
  }

  res.json({ success: true, data: saleRequest });
});

export const getMyOwnershipPeriods = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) return res.json({ success: true, data: { current: [], past: [] } });

  const periods = await OwnershipPeriod.find({ customer: customer._id })
    .populate('property', 'propertyNumber blockName sectorName status propertyType price')
    .sort({ startDate: -1 });

  res.json({
    success: true,
    data: {
      current: periods.filter((p) => p.isCurrent),
      past: periods.filter((p) => !p.isCurrent),
      all: periods,
    },
  });
});

export const lookupMyProperty = asyncHandler(async (req, res) => {
  const { propertyNumber, blockName } = req.query;
  if (!propertyNumber || !blockName) {
    return res.status(400).json({ success: false, message: 'Property number and block name required' });
  }

  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const periods = await OwnershipPeriod.find({
    customer: customer._id,
    propertyNumber: { $regex: propertyNumber.trim(), $options: 'i' },
    blockName: { $regex: blockName.trim(), $options: 'i' },
  })
    .populate('property')
    .sort({ startDate: -1 });

  const property = await Property.findOne({
    propertyNumber: { $regex: propertyNumber.trim(), $options: 'i' },
    blockName: { $regex: blockName.trim(), $options: 'i' },
  })
    .populate('currentOwner', 'fullName')
    .populate('activeSaleRequest');

  let saleInfo = null;
  if (property?.marketStatus === 'sale_pending' && property.activeSaleRequest) {
    const sale = await SaleRequest.findById(property.activeSaleRequest)
      .populate('seller', 'fullName')
      .populate('buyer', 'fullName');
    if (sale) {
      saleInfo = {
        requestNumber: sale.requestNumber,
        seller: sale.sellerName,
        buyer: sale.buyerName,
        status: sale.status,
      };
    }
  }

  res.json({
    success: true,
    data: { periods, property, saleInfo, isOwner: property?.currentOwner?._id?.toString() === customer._id.toString() },
  });
});

import Property from '../models/Property.js';
import Block from '../models/Block.js';
import Customer from '../models/Customer.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import OwnershipPeriod from '../models/OwnershipPeriod.js';
import { generatePropertyQR } from '../utils/qrcode.js';
import { asyncHandler } from '../middleware/validate.js';
import { createNotification } from '../utils/notifications.js';
import { recalculateBlockStats } from '../utils/blockStats.js';
import { deletePropertyFully } from '../utils/propertyCleanup.js';
import { PROPERTY_STATUSES, canAssign, canSellOrBuy, statusMessage } from '../utils/propertyStatus.js';
import { cancelPendingSalesForProperty } from '../utils/saleCleanup.js';

const generatePropertyId = async () => {
  const count = await Property.countDocuments();
  return `DHA-${String(count + 1).padStart(6, '0')}`;
};

export const getProperties = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    status,
    propertyType,
    blockName,
    sectorName,
    plotSize,
    minPrice,
    maxPrice,
    search,
    isFeatured,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (propertyType) filter.propertyType = propertyType;
  if (blockName) filter.blockName = blockName;
  if (sectorName) filter.sectorName = sectorName;
  if (plotSize) filter.plotSize = plotSize;
  if (isFeatured) filter.isFeatured = isFeatured === 'true';
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    filter.$or = [
      { propertyNumber: { $regex: search, $options: 'i' } },
      { blockName: { $regex: search, $options: 'i' } },
      { sectorName: { $regex: search, $options: 'i' } },
      { propertyId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [rawProperties, total] = await Promise.all([
    Property.find(filter)
      .populate('block', 'name')
      .populate('currentOwner', 'fullName cnic phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments(filter),
  ]);

  const properties = rawProperties.map((p) => {
    const doc = p.toObject();
    if (!doc.currentOwner) {
      doc.marketStatus = 'available';
      doc.ownerName = '';
    }
    return doc;
  });

  res.json({
    success: true,
    data: properties,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('block')
    .populate('currentOwner', 'fullName fatherName cnic phone email address')
    .populate('documents');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  res.json({ success: true, data: property });
});

export const createProperty = asyncHandler(async (req, res) => {
  const propertyId = await generatePropertyId();
  const { status = 'pending' } = req.body;

  if (!['active', 'pending', 'inactive', 'case'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const propertyData = {
    ...req.body,
    propertyId,
    sectorName: req.body.sectorName?.trim() || '',
    status,
    statusLocked: true,
    statusSetAt: new Date(),
    marketStatus: 'available',
    createdBy: req.user._id,
  };

  if (propertyData.width && propertyData.length) {
    propertyData.totalArea = propertyData.width * propertyData.length;
  }

  const property = await Property.create(propertyData);
  property.qrCode = await generatePropertyQR(property);
  await property.save();

  if (property.block) {
    await recalculateBlockStats(property.block);
  }

  res.status(201).json({ success: true, data: property });
});

export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (property.statusLocked && req.body.status && req.body.status !== property.status) {
    return res.status(400).json({
      success: false,
      message: 'Property status is locked and cannot be changed after creation',
    });
  }

  const { status, ...updateData } = req.body;
  if (property.statusLocked) delete updateData.status;

  const updated = await Property.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, data: updated });
});

export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  const blockId = await deletePropertyFully(property._id);
  if (blockId) {
    await recalculateBlockStats(blockId);
  }
  res.json({ success: true, message: 'Property deleted' });
});

export const assignProperty = asyncHandler(async (req, res) => {
  const { customerId, ownershipDetails, purchaseDate } = req.body;
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (property.currentOwner) {
    return res.status(400).json({ success: false, message: 'Property already has an owner' });
  }

  if (!canAssign(property.status)) {
    return res.status(400).json({
      success: false,
      message: statusMessage(property.status, 'assign'),
    });
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const startDate = purchaseDate ? new Date(purchaseDate) : new Date();

  property.currentOwner = customerId;
  property.ownerName = customer.fullName;
  property.ownershipDetails = ownershipDetails || '';
  property.purchaseDate = startDate;
  property.marketStatus = 'owned';
  await property.save();

  customer.properties.push(property._id);
  await customer.save();

  await OwnershipPeriod.create({
    property: property._id,
    customer: customerId,
    propertyNumber: property.propertyNumber,
    blockName: property.blockName,
    sectorName: property.sectorName,
    propertyType: property.propertyType,
    startDate,
    isCurrent: true,
    role: 'owner',
  });

  await OwnershipHistory.create({
    property: property._id,
    customer: customerId,
    ownerName: customer.fullName,
    ownerCnic: customer.cnic || '',
    action: 'assigned',
    details: ownershipDetails || 'Initial property assignment',
    status: property.status,
    performedBy: req.user._id,
  });

  if (property.block) {
    await recalculateBlockStats(property.block);
  }

  if (customer.user) {
    await createNotification({
      recipientId: customer.user,
      title: 'Property Assigned',
      message: `Property ${property.propertyNumber} in ${property.blockName} has been assigned to you.`,
      type: 'property_assigned',
      relatedModel: 'Property',
      relatedId: property._id,
    });
  }

  res.json({ success: true, data: property });
});

export const verifyProperty = asyncHandler(async (req, res) => {
  const { propertyNumber, blockName } = req.body;

  if (!propertyNumber?.trim() || !blockName?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please select plot/house number and block',
    });
  }

  const property = await Property.findOne({
    propertyNumber: { $regex: `^${propertyNumber.trim()}$`, $options: 'i' },
    blockName: { $regex: `^${blockName.trim()}$`, $options: 'i' },
  })
    .populate('currentOwner', 'fullName cnic phone')
    .populate('block', 'name');

  if (!property) {
    return res.json({
      success: true,
      verified: false,
      message: 'No plot/house number found in this block',
    });
  }

  let saleInfo = null;
  if (property.marketStatus === 'sale_pending' && property.activeSaleRequest) {
    const SaleRequest = (await import('../models/SaleRequest.js')).default;
    const sale = await SaleRequest.findById(property.activeSaleRequest);
    if (sale) {
      saleInfo = {
        seller: sale.sellerName,
        buyer: sale.buyerName,
        requestNumber: sale.requestNumber,
        status: sale.status,
      };
    }
  }

  res.json({
    success: true,
    verified: true,
    data: {
      ownerName: property.ownerName || property.currentOwner?.fullName || 'Unassigned',
      ownerCnic: property.currentOwner?.cnic || '—',
      propertyNumber: property.propertyNumber,
      propertyId: property.propertyId,
      blockName: property.blockName,
      sectorName: property.sectorName,
      propertyType: property.propertyType,
      width: property.width,
      length: property.length,
      totalArea: property.totalArea,
      plotSize: property.plotSize,
      purchaseDate: property.purchaseDate,
      status: property.status,
      marketStatus: property.marketStatus,
      ownershipDetails: property.ownershipDetails,
      hasOwner: !!property.currentOwner,
      saleInfo,
    },
  });
});

export const getPropertyOwnershipRecords = asyncHandler(async (req, res) => {
  const { propertyNumber, blockName } = req.query;

  if (!propertyNumber?.trim() || !blockName?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Property number and block name are required',
    });
  }

  const property = await Property.findOne({
    propertyNumber: { $regex: `^${propertyNumber.trim()}$`, $options: 'i' },
    blockName: { $regex: `^${blockName.trim()}$`, $options: 'i' },
  });

  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found in this block' });
  }

  const [periods, history] = await Promise.all([
    OwnershipPeriod.find({ property: property._id })
      .populate('customer', 'fullName phone email')
      .sort({ startDate: 1 }),
    OwnershipHistory.find({ property: property._id })
      .populate('performedBy', 'name')
      .sort({ createdAt: 1 }),
  ]);

  const ownerIds = new Set(periods.map((p) => p.customer?._id?.toString()).filter(Boolean));

  res.json({
    success: true,
    data: {
      property: {
        _id: property._id,
        propertyNumber: property.propertyNumber,
        propertyId: property.propertyId,
        blockName: property.blockName,
        sectorName: property.sectorName,
        propertyType: property.propertyType,
        status: property.status,
        marketStatus: property.marketStatus,
        currentOwnerName: property.ownerName || 'Unassigned',
      },
      totalOwners: ownerIds.size,
      totalRecords: periods.length,
      owners: periods.map((p, index) => ({
        order: index + 1,
        ownerName: p.customer?.fullName || 'Unknown',
        phone: p.customer?.phone || '',
        email: p.customer?.email || '',
        startDate: p.startDate,
        endDate: p.endDate,
        isCurrent: p.isCurrent,
        role: p.role,
      })),
      history: history.map((h) => ({
        action: h.action,
        ownerName: h.ownerName,
        previousOwnerName: h.previousOwnerName,
        details: h.details,
        date: h.createdAt,
        performedBy: h.performedBy?.name || 'System',
      })),
    },
  });
});

export const getFeaturedProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ isFeatured: true, status: 'active' })
    .limit(6)
    .populate('block', 'name');
  res.json({ success: true, data: properties });
});

export const getCustomerProperties = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) {
    return res.json({ success: true, data: { current: [], past: [], saleRequests: [] } });
  }

  const [currentProperties, pastPeriods, saleRequests] = await Promise.all([
    Property.find({ currentOwner: customer._id })
      .populate('block')
      .populate('activeSaleRequest')
      .sort({ createdAt: -1 }),
    OwnershipPeriod.find({ customer: customer._id, isCurrent: false })
      .populate('property')
      .sort({ endDate: -1 }),
    (await import('../models/SaleRequest.js')).default.find({
      $or: [{ seller: customer._id }, { buyer: customer._id }],
      status: 'pending',
    }).populate('property', 'propertyNumber blockName'),
  ]);

  const currentWithPeriods = await Promise.all(
    currentProperties.map(async (prop) => {
      const period = await OwnershipPeriod.findOne({
        property: prop._id,
        customer: customer._id,
        isCurrent: true,
      });
      let saleInfo = null;
      if (prop.marketStatus === 'sale_pending') {
        const SaleRequest = (await import('../models/SaleRequest.js')).default;
        const sale = await SaleRequest.findById(prop.activeSaleRequest)
          .populate('seller', 'fullName')
          .populate('buyer', 'fullName');
        if (sale) {
          saleInfo = { seller: sale.sellerName, buyer: sale.buyerName, requestNumber: sale.requestNumber, status: sale.status };
        }
      }
      return {
        ...prop.toObject(),
        ownershipStartDate: period?.startDate,
        ownershipEndDate: period?.endDate,
        saleInfo,
      };
    })
  );

  res.json({
    success: true,
    data: {
      current: currentWithPeriods,
      past: pastPeriods,
      saleRequests,
    },
  });
});

export const updatePropertyStatus = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate('currentOwner');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (property.statusLocked) {
    return res.status(400).json({
      success: false,
      message: 'Property status is set at creation and cannot be changed here. Use Cases section for legal case updates.',
    });
  }

  const { status } = req.body;
  if (!PROPERTY_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid property status' });
  }

  const previousStatus = property.status;
  if (previousStatus === status) {
    return res.json({ success: true, data: property });
  }

  let cancelledSales = 0;
  if (!canSellOrBuy(status) && property.marketStatus === 'sale_pending') {
    cancelledSales = await cancelPendingSalesForProperty(property._id, req.user._id);
  }

  property.status = status;
  await property.save();

  if (property.block) {
    await recalculateBlockStats(property.block);
  }

  if (property.currentOwner) {
    await OwnershipHistory.create({
      property: property._id,
      customer: property.currentOwner._id,
      ownerName: property.currentOwner.fullName,
      ownerCnic: property.currentOwner.cnic || '',
      action: 'status_changed',
      details: `Status changed from ${previousStatus} to ${status}${cancelledSales ? `. ${cancelledSales} pending sale(s) cancelled.` : ''}`,
      status,
      performedBy: req.user._id,
      metadata: { previousStatus, newStatus: status, cancelledSales },
    });

    if (property.currentOwner.user) {
      await createNotification({
        recipientId: property.currentOwner.user,
        title: 'Property Status Updated',
        message: `Your property ${property.propertyNumber} status is now ${status.toUpperCase()}.${cancelledSales ? ' Pending sale requests were cancelled.' : ''}`,
        type: 'status_changed',
        relatedModel: 'Property',
        relatedId: property._id,
      });
    }
  }

  res.json({ success: true, data: property });
});

export const getPropertyStats = asyncHandler(async (req, res) => {
  const stats = await Property.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const typeStats = await Property.aggregate([
    {
      $group: {
        _id: '$propertyType',
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Property.countDocuments();
  const totalRevenue = await Property.aggregate([
    { $match: { status: { $in: ['active', 'inactive'] } } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);

  res.json({
    success: true,
    data: {
      total,
      byStatus: stats,
      byType: typeStats,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
  });
});

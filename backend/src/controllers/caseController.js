import Case from '../models/Case.js';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import { asyncHandler } from '../middleware/validate.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';
import { recalculateBlockStats } from '../utils/blockStats.js';
import { cancelPendingSalesForProperty } from '../utils/saleCleanup.js';
import { PROPERTY_STATUSES } from '../utils/propertyStatus.js';

const generateCaseNumber = async () => {
  const count = await Case.countDocuments();
  return `CASE-${String(count + 1).padStart(6, '0')}`;
};

export const getCases = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const [cases, total] = await Promise.all([
    Case.find(filter)
      .populate('property', 'propertyNumber blockName sectorName status')
      .populate('customer', 'fullName cnic phone')
      .populate('registeredBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Case.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: cases,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id)
    .populate('property')
    .populate('customer')
    .populate('documents')
    .populate('notes.addedBy', 'name')
    .populate('registeredBy', 'name')
    .populate('resolvedBy', 'name');
  if (!caseDoc) {
    return res.status(404).json({ success: false, message: 'Case not found' });
  }
  res.json({ success: true, data: caseDoc });
});

export const createCase = asyncHandler(async (req, res) => {
  const { propertyId, customerId, title, description, caseType, priority } = req.body;
  const caseNumber = await generateCaseNumber();

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  const caseDoc = await Case.create({
    caseNumber,
    property: propertyId,
    customer: customerId || property.currentOwner,
    title,
    description,
    caseType,
    priority,
    registeredBy: req.user._id,
  });

  property.status = 'case';
  await cancelPendingSalesForProperty(propertyId, req.user._id);
  await property.save();

  if (property.block) {
    await recalculateBlockStats(property.block);
  }

  if (property.currentOwner) {
    const customer = await Customer.findById(property.currentOwner);
    await OwnershipHistory.create({
      property: propertyId,
      customer: property.currentOwner,
      ownerName: customer?.fullName || '',
      ownerCnic: customer?.cnic || '',
      action: 'case_registered',
      details: `Case ${caseNumber}: ${title}`,
      status: 'case',
      performedBy: req.user._id,
      metadata: { caseId: caseDoc._id, caseNumber },
    });

    if (customer?.user) {
      await createNotification({
        recipientId: customer.user,
        title: 'Legal Case Registered',
        message: `A legal case (${caseNumber}) has been registered for your property ${property.propertyNumber}.`,
        type: 'case_registered',
        relatedModel: 'Case',
        relatedId: caseDoc._id,
      });
    }
  }

  res.status(201).json({ success: true, data: caseDoc });
});

export const updateCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!caseDoc) {
    return res.status(404).json({ success: false, message: 'Case not found' });
  }
  res.json({ success: true, data: caseDoc });
});

export const addCaseNote = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    return res.status(404).json({ success: false, message: 'Case not found' });
  }

  caseDoc.notes.push({ content, addedBy: req.user._id });
  await caseDoc.save();
  res.json({ success: true, data: caseDoc });
});

export const resolveCase = asyncHandler(async (req, res) => {
  const { resolution, newPropertyStatus = 'active' } = req.body;
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    return res.status(404).json({ success: false, message: 'Case not found' });
  }

  caseDoc.status = 'resolved';
  caseDoc.resolution = resolution;
  caseDoc.resolvedAt = new Date();
  caseDoc.resolvedBy = req.user._id;
  await caseDoc.save();

  const property = await Property.findById(caseDoc.property);
  if (property) {
    const newStatus = PROPERTY_STATUSES.includes(newPropertyStatus) ? newPropertyStatus : 'active';
    property.status = newStatus;
    await property.save();
    if (property.block) {
      await recalculateBlockStats(property.block);
    }
    if (property.currentOwner) {
      const customer = await Customer.findById(property.currentOwner);
      await OwnershipHistory.create({
        property: property._id,
        customer: property.currentOwner,
        ownerName: customer?.fullName || '',
        ownerCnic: customer?.cnic || '',
        action: 'status_changed',
        details: `Case ${caseDoc.caseNumber} resolved. Property status set to ${newStatus}.`,
        status: newStatus,
        performedBy: req.user._id,
        metadata: { caseId: caseDoc._id, resolution },
      });
    }
  }

  res.json({ success: true, data: caseDoc });
});

export const getCustomerCases = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) {
    return res.json({ success: true, data: [] });
  }

  const cases = await Case.find({ customer: customer._id })
    .populate('property', 'propertyNumber blockName status')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: cases });
});

export const getCaseStats = asyncHandler(async (req, res) => {
  const stats = await Case.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const open = await Case.countDocuments({ status: { $in: ['open', 'in_progress'] } });
  res.json({ success: true, data: { stats, openCases: open } });
});

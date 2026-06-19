import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import Block from '../models/Block.js';
import Transfer from '../models/Transfer.js';
import Case from '../models/Case.js';
import OwnershipHistory from '../models/OwnershipHistory.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/validate.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    totalProperties,
    totalBlocks,
    totalPlots,
    totalHouses,
    activeProperties,
    soldProperties,
    pendingProperties,
    caseProperties,
    recentCustomers,
    recentActivities,
    revenueData,
    monthlyRegistrations,
  ] = await Promise.all([
    Customer.countDocuments(),
    Property.countDocuments(),
    Block.countDocuments(),
    Property.countDocuments({ propertyType: 'plot' }),
    Property.countDocuments({ propertyType: 'house' }),
    Property.countDocuments({ status: 'active' }),
    Property.countDocuments({ status: 'inactive' }),
    Property.countDocuments({ status: 'pending' }),
    Property.countDocuments({ status: 'case' }),
    Customer.find().sort({ createdAt: -1 }).limit(5).select('fullName email createdAt'),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name'),
    Property.aggregate([
      { $match: { status: { $in: ['active', 'inactive'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
    Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const propertyByBlock = await Property.aggregate([
    { $group: { _id: '$blockName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const statusDistribution = await Property.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalCustomers,
        totalProperties,
        totalBlocks,
        totalPlots,
        totalHouses,
        activeProperties,
        soldProperties,
        pendingProperties,
        caseProperties,
        totalRevenue: revenueData[0]?.total || 0,
      },
      recentCustomers,
      recentActivities,
      monthlyRegistrations,
      propertyByBlock,
      statusDistribution,
    },
  });
});

export const getOwnershipHistory = asyncHandler(async (req, res) => {
  const { propertyId, customerId } = req.query;
  const filter = {};
  if (propertyId) filter.property = propertyId;
  if (customerId) filter.customer = customerId;

  const history = await OwnershipHistory.find(filter)
    .populate('property', 'propertyNumber blockName')
    .populate('customer', 'fullName cnic')
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: history });
});

export const getCustomerOwnershipHistory = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) {
    return res.json({ success: true, data: [] });
  }

  const history = await OwnershipHistory.find({ customer: customer._id })
    .populate('property', 'propertyNumber blockName sectorName status')
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: history });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(),
  ]);
  res.json({
    success: true,
    data: logs,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

export const getPublicStats = asyncHandler(async (req, res) => {
  const [totalProperties, totalCustomers, totalBlocks, activeProperties] = await Promise.all([
    Property.countDocuments(),
    Customer.countDocuments(),
    Block.countDocuments(),
    Property.countDocuments({ status: 'active' }),
  ]);

  res.json({
    success: true,
    data: {
      totalProperties,
      totalCustomers,
      totalBlocks,
      activeProperties,
      yearsOfExcellence: 25,
      satisfactionRate: 98,
    },
  });
});

import Block from '../models/Block.js';
import Property from '../models/Property.js';
import { asyncHandler } from '../middleware/validate.js';

export const getBlocks = asyncHandler(async (req, res) => {
  const blocks = await Block.find().sort({ name: 1 });
  res.json({ success: true, data: blocks });
});

export const getBlock = asyncHandler(async (req, res) => {
  const block = await Block.findById(req.params.id);
  if (!block) {
    return res.status(404).json({ success: false, message: 'Block not found' });
  }

  const properties = await Property.find({ block: block._id })
    .populate('currentOwner', 'fullName cnic')
    .sort({ propertyNumber: 1 });

  res.json({ success: true, data: { block, properties } });
});

export const createBlock = asyncHandler(async (req, res) => {
  const block = await Block.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: block });
});

export const updateBlock = asyncHandler(async (req, res) => {
  const block = await Block.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!block) {
    return res.status(404).json({ success: false, message: 'Block not found' });
  }
  res.json({ success: true, data: block });
});

export const deleteBlock = asyncHandler(async (req, res) => {
  const propertyCount = await Property.countDocuments({ block: req.params.id });
  if (propertyCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete block with existing properties',
    });
  }
  await Block.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Block deleted' });
});

export const refreshBlockStats = asyncHandler(async (req, res) => {
  const block = await Block.findById(req.params.id);
  if (!block) {
    return res.status(404).json({ success: false, message: 'Block not found' });
  }

  const stats = await Property.aggregate([
    { $match: { block: block._id } },
    {
      $group: {
        _id: null,
        totalPlots: { $sum: { $cond: [{ $eq: ['$propertyType', 'plot'] }, 1, 0] } },
        totalHouses: { $sum: { $cond: [{ $eq: ['$propertyType', 'house'] }, 1, 0] } },
        available: { $sum: { $cond: [{ $in: ['$status', ['active', 'pending']] }, 1, 0] } },
        sold: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
      },
    },
  ]);

  const s = stats[0] || { totalPlots: 0, totalHouses: 0, available: 0, sold: 0 };
  block.totalPlots = s.totalPlots;
  block.totalHouses = s.totalHouses;
  block.availableProperties = s.available;
  block.soldProperties = s.sold;
  await block.save();

  res.json({ success: true, data: block });
});

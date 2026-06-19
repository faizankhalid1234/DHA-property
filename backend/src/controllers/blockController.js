import Block from '../models/Block.js';
import Property from '../models/Property.js';
import { asyncHandler } from '../middleware/validate.js';
import { recalculateBlockStats, recalculateAllBlockStats, countPropertiesForBlock } from '../utils/blockStats.js';

export const getBlocks = asyncHandler(async (req, res) => {
  await recalculateAllBlockStats();
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
  const block = await Block.findById(req.params.id);
  if (!block) {
    return res.status(404).json({ success: false, message: 'Block not found' });
  }

  const propertyCount = await countPropertiesForBlock(block);
  if (propertyCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete block — ${propertyCount} propert${propertyCount === 1 ? 'y' : 'ies'} still linked to this block`,
    });
  }

  await Block.findByIdAndDelete(block._id);
  res.json({ success: true, message: 'Block deleted' });
});

export const refreshBlockStats = asyncHandler(async (req, res) => {
  const block = await recalculateBlockStats(req.params.id);
  if (!block) {
    return res.status(404).json({ success: false, message: 'Block not found' });
  }
  res.json({ success: true, data: block });
});

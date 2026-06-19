import Block from '../models/Block.js';
import Property from '../models/Property.js';

export async function recalculateBlockStats(blockId) {
  if (!blockId) return null;

  const stats = await Property.aggregate([
    { $match: { block: blockId } },
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

  return Block.findByIdAndUpdate(
    blockId,
    {
      totalPlots: s.totalPlots,
      totalHouses: s.totalHouses,
      availableProperties: s.available,
      soldProperties: s.sold,
    },
    { new: true }
  );
}

export async function recalculateAllBlockStats() {
  const blocks = await Block.find().select('_id');
  await Promise.all(blocks.map((b) => recalculateBlockStats(b._id)));
}

export async function countPropertiesForBlock(block) {
  if (!block) return 0;
  return Property.countDocuments({
    $or: [{ block: block._id }, { blockName: { $regex: `^${block.name}$`, $options: 'i' } }],
  });
}

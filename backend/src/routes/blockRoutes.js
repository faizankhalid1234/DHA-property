import express from 'express';
import {
  getBlocks,
  getBlock,
  createBlock,
  updateBlock,
  deleteBlock,
  refreshBlockStats,
} from '../controllers/blockController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBlocks);
router.get('/:id', getBlock);
router.post('/', protect, adminOnly, createBlock);
router.put('/:id', protect, adminOnly, updateBlock);
router.delete('/:id', protect, adminOnly, deleteBlock);
router.post('/:id/refresh-stats', protect, adminOnly, refreshBlockStats);

export default router;

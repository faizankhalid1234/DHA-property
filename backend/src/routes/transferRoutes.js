import express from 'express';
import {
  getTransfers,
  getTransfer,
  createTransfer,
  getCustomerTransfers,
  getPropertyTransferHistory,
} from '../controllers/transferController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-transfers', protect, getCustomerTransfers);
router.get('/property/:propertyId', protect, adminOnly, getPropertyTransferHistory);
router.get('/', protect, adminOnly, getTransfers);
router.get('/:id', protect, adminOnly, getTransfer);
router.post('/', protect, adminOnly, createTransfer);

export default router;

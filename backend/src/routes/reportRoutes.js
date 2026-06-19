import express from 'express';
import {
  exportPropertyReport,
  exportCustomerReport,
  exportTransferReport,
  exportCaseReport,
  exportOwnershipReport,
  exportRevenueReport,
} from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/properties', exportPropertyReport);
router.get('/customers', exportCustomerReport);
router.get('/transfers', exportTransferReport);
router.get('/cases', exportCaseReport);
router.get('/ownership', exportOwnershipReport);
router.get('/revenue', exportRevenueReport);

export default router;

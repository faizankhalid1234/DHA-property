import express from 'express';
import {
  getDashboardStats,
  getOwnershipHistory,
  getCustomerOwnershipHistory,
  getAuditLogs,
  getPublicStats,
} from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/public-stats', getPublicStats);
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/ownership-history', protect, adminOnly, getOwnershipHistory);
router.get('/my-ownership-history', protect, getCustomerOwnershipHistory);
router.get('/audit-logs', protect, adminOnly, getAuditLogs);

export default router;

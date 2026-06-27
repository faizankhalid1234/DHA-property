import express from 'express';
import {
  getSaleRequests,
  getMySaleRequests,
  createSaleRequest,
  createSellerSale,
  createAdminSale,
  approveSaleRequest,
  rejectSaleRequest,
  getMyOwnershipPeriods,
  lookupMyProperty,
} from '../controllers/saleController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-periods', protect, getMyOwnershipPeriods);
router.get('/my-requests', protect, getMySaleRequests);
router.get('/lookup', protect, lookupMyProperty);
router.post('/request', protect, createSaleRequest);
router.post('/sell', protect, createSellerSale);
router.post('/admin', protect, adminOnly, createAdminSale);
router.get('/', protect, adminOnly, getSaleRequests);
router.post('/:id/approve', protect, adminOnly, approveSaleRequest);
router.post('/:id/reject', protect, adminOnly, rejectSaleRequest);

export default router;

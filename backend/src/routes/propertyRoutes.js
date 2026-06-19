import express from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  assignProperty,
  verifyProperty,
  getPropertyOwnershipRecords,
  getFeaturedProperties,
  getCustomerProperties,
  updatePropertyStatus,
  getPropertyStats,
} from '../controllers/propertyController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/featured', getFeaturedProperties);
router.post('/verify', verifyProperty);
router.get('/ownership-records', getPropertyOwnershipRecords);
router.get('/my-properties', protect, getCustomerProperties);
router.get('/stats', protect, adminOnly, getPropertyStats);
router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', protect, adminOnly, createProperty);
router.put('/:id', protect, adminOnly, updateProperty);
router.delete('/:id', protect, adminOnly, deleteProperty);
router.post('/:id/assign', protect, adminOnly, assignProperty);
router.patch('/:id/status', protect, adminOnly, updatePropertyStatus);

export default router;

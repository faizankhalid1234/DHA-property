import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  verifyCustomerOwnership,
  getCustomerCount,
} from '../controllers/customerController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/count', getCustomerCount);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.patch('/:id/verify', verifyCustomerOwnership);

export default router;

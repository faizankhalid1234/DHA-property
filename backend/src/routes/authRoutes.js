import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  customerRegister,
  getUsers,
  updateUserRole,
} from '../controllers/authController.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/customer-register', customerRegister);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/users', protect, superAdminOnly, getUsers);
router.put('/users/:id', protect, superAdminOnly, updateUserRole);

export default router;

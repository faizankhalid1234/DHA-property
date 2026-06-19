import express from 'express';
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  addCaseNote,
  resolveCase,
  getCustomerCases,
  getCaseStats,
} from '../controllers/caseController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-cases', protect, getCustomerCases);
router.get('/stats', protect, adminOnly, getCaseStats);
router.get('/', protect, adminOnly, getCases);
router.get('/:id', protect, getCase);
router.post('/', protect, adminOnly, createCase);
router.put('/:id', protect, adminOnly, updateCase);
router.post('/:id/notes', protect, adminOnly, addCaseNote);
router.post('/:id/resolve', protect, adminOnly, resolveCase);

export default router;

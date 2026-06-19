import express from 'express';
import {
  getDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  getCustomerDocuments,
  uploadPropertyImages,
} from '../controllers/documentController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/my-documents', protect, getCustomerDocuments);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocument);
router.post('/upload', protect, adminOnly, upload.single('file'), uploadDocument);
router.post(
  '/property/:propertyId/images',
  protect,
  adminOnly,
  upload.array('images', 10),
  uploadPropertyImages
);
router.delete('/:id', protect, adminOnly, deleteDocument);

export default router;

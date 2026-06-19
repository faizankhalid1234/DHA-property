import Document from '../models/Document.js';
import Property from '../models/Property.js';
import Customer from '../models/Customer.js';
import { asyncHandler } from '../middleware/validate.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import { createNotification } from '../utils/notifications.js';

export const getDocuments = asyncHandler(async (req, res) => {
  const { propertyId, customerId, documentType } = req.query;
  const filter = {};
  if (propertyId) filter.property = propertyId;
  if (customerId) filter.customer = customerId;
  if (documentType) filter.documentType = documentType;

  const documents = await Document.find(filter)
    .populate('uploadedBy', 'name')
    .populate('property', 'propertyNumber blockName')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('property')
    .populate('customer', 'fullName cnic');
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }
  res.json({ success: true, data: document });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { title, documentType, propertyId, customerId, caseId, transferId, description } = req.body;

  let fileUrl = '';
  let publicId = '';

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    const result = await uploadToCloudinary(req.file, 'dha-documents');
    fileUrl = result.secure_url;
    publicId = result.public_id;
  } else {
    fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  const document = await Document.create({
    title: title || req.file.originalname,
    documentType: documentType || 'other',
    fileUrl,
    publicId,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    property: propertyId || undefined,
    customer: customerId || undefined,
    case: caseId || undefined,
    transfer: transferId || undefined,
    uploadedBy: req.user._id,
    description,
  });

  if (propertyId) {
    await Property.findByIdAndUpdate(propertyId, { $push: { documents: document._id } });
  }

  if (customerId) {
    const customer = await Customer.findById(customerId);
    if (customer?.user) {
      await createNotification({
        recipientId: customer.user,
        title: 'Document Uploaded',
        message: `A new document "${document.title}" has been uploaded to your account.`,
        type: 'document_uploaded',
        relatedModel: 'Document',
        relatedId: document._id,
      });
    }
  }

  res.status(201).json({ success: true, data: document });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (document.publicId && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    const cloudinary = (await import('../config/cloudinary.js')).default;
    await cloudinary.uploader.destroy(document.publicId).catch(console.error);
  }

  if (document.property) {
    await Property.findByIdAndUpdate(document.property, { $pull: { documents: document._id } });
  }

  await document.deleteOne();
  res.json({ success: true, message: 'Document deleted' });
});

export const getCustomerDocuments = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user._id });
  if (!customer) {
    return res.json({ success: true, data: [] });
  }

  const documents = await Document.find({
    $or: [{ customer: customer._id }, { property: { $in: customer.properties } }],
  })
    .populate('property', 'propertyNumber blockName')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: documents });
});

export const uploadPropertyImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  const property = await Property.findById(req.params.propertyId);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  const images = [];
  for (const file of req.files) {
    let url = '';
    let publicId = '';
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
      const result = await uploadToCloudinary(file, 'dha-properties');
      url = result.secure_url;
      publicId = result.public_id;
    } else {
      url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    images.push({ url, publicId, caption: file.originalname });
  }

  property.images.push(...images);
  await property.save();
  res.json({ success: true, data: property });
});

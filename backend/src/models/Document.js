import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    documentType: {
      type: String,
      enum: ['registry', 'transfer_letter', 'ownership_certificate', 'noc', 'image', 'legal', 'other'],
      default: 'other',
    },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    transfer: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: false },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;

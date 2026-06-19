import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'property_assigned',
        'property_transferred',
        'case_registered',
        'document_uploaded',
        'status_changed',
        'general',
      ],
      default: 'general',
    },
    relatedModel: { type: String, enum: ['Property', 'Customer', 'Case', 'Transfer', 'Document'] },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

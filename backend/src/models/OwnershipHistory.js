import mongoose from 'mongoose';

const ownershipHistorySchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    ownerName: { type: String, required: true },
    ownerCnic: { type: String, default: '' },
    action: {
      type: String,
      enum: ['assigned', 'transferred', 'verified', 'status_changed', 'case_registered'],
      required: true,
    },
    previousOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    previousOwnerName: { type: String, default: '' },
    details: { type: String, default: '' },
    status: { type: String, enum: ['active', 'pending', 'inactive', 'case'], default: 'active' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ownershipHistorySchema.index({ property: 1, createdAt: -1 });

const OwnershipHistory = mongoose.model('OwnershipHistory', ownershipHistorySchema);
export default OwnershipHistory;

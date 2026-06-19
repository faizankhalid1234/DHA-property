import mongoose from 'mongoose';

const ownershipPeriodSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    propertyNumber: { type: String, required: true },
    blockName: { type: String, required: true },
    sectorName: { type: String, default: '' },
    propertyType: { type: String, default: 'plot' },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    isCurrent: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ['owner', 'seller', 'buyer'],
      default: 'owner',
    },
    transfer: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ownershipPeriodSchema.index({ customer: 1, isCurrent: 1 });
ownershipPeriodSchema.index({ property: 1, startDate: -1 });

const OwnershipPeriod = mongoose.model('OwnershipPeriod', ownershipPeriodSchema);
export default OwnershipPeriod;

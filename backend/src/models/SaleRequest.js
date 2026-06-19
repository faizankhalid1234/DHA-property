import mongoose from 'mongoose';

const saleRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    sellerName: { type: String, required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    buyerName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    requestedBy: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    notes: { type: String, default: '' },
    saleDate: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

const SaleRequest = mongoose.model('SaleRequest', saleRequestSchema);
export default SaleRequest;

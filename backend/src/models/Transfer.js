import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    previousOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    previousOwnerName: { type: String, required: true },
    previousOwnerCnic: { type: String, required: true },
    newOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    newOwnerName: { type: String, required: true },
    newOwnerCnic: { type: String, required: true },
    transferDate: { type: Date, default: Date.now },
    transferReason: { type: String, default: '' },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    notes: { type: String, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

const Transfer = mongoose.model('Transfer', transferSchema);
export default Transfer;

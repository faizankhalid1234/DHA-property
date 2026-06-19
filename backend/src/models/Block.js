import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    sector: { type: String, default: '', trim: true },
    totalPlots: { type: Number, default: 0 },
    totalHouses: { type: Number, default: 0 },
    availableProperties: { type: Number, default: 0 },
    soldProperties: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Block = mongoose.model('Block', blockSchema);
export default Block;

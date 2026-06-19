import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true },
    profileImage: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    isVerified: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerSchema.index({ fullName: 'text', email: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;

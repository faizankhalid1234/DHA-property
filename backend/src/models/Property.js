import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    propertyId: { type: String, required: true, unique: true },
    propertyNumber: { type: String, required: true, trim: true },
    propertyType: {
      type: String,
      enum: ['plot', 'house', 'commercial'],
      required: true,
    },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
    blockName: { type: String, required: true },
    sectorName: { type: String, default: '', trim: true },
    plotSize: {
      type: String,
      enum: ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', 'Custom Size'],
      default: '5 Marla',
    },
    width: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    totalArea: { type: Number, default: 0 },
    areaUnit: { type: String, default: 'sq ft' },
    location: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    price: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    ownershipDetails: { type: String, default: '' },
    currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    ownerName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'pending', 'inactive', 'case'],
      default: 'pending',
    },
    statusLocked: { type: Boolean, default: true },
    statusSetAt: { type: Date, default: Date.now },
    marketStatus: {
      type: String,
      enum: ['available', 'owned', 'sale_pending'],
      default: 'available',
    },
    activeSaleRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleRequest' },
    images: [{ url: String, publicId: String, caption: String }],
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    qrCode: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    description: { type: String, default: '' },
    amenities: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

propertySchema.index({ propertyNumber: 1, blockName: 1 });
propertySchema.index({ status: 1, propertyType: 1 });
propertySchema.index({ sectorName: 1, blockName: 1 });

const Property = mongoose.model('Property', propertySchema);
export default Property;

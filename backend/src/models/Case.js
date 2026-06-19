import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    caseType: {
      type: String,
      enum: ['legal_dispute', 'fraud', 'ownership_conflict', 'court_case', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    notes: [
      {
        content: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    resolution: { type: String, default: '' },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Case = mongoose.model('Case', caseSchema);
export default Case;

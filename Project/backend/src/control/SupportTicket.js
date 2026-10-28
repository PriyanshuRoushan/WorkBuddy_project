import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlCompany', required: true, index: true },
  openedByTenantUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  subject: { type: String, required: true, trim: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
  messages: [{
    authorType: { type: String, enum: ['COMPANY', 'SUPPORT'], required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authorName: String,
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('ControlSupportTicket', schema, 'control_support_tickets');

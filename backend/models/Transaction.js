const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['purchase', 'sale'],
    required: [true, 'Transaction type is required']
  },
  items: [transactionItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-generate transaction ID
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const count = await this.constructor.countDocuments();
    const prefix = this.type === 'purchase' ? 'PUR' : 'SAL';
    this.transactionId = `${prefix}-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ customer: 1 });
transactionSchema.index({ supplier: 1 });
transactionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

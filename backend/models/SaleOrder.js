const mongoose = require('mongoose');

const saleOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['sale'],
    default: 'sale',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerUnit: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 18
  },
  taxAmount: {
    type: Number,
    required: true
  },
  shippingAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'upi', 'cheque'],
    default: 'cash'
  },
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  billingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String
  },
  vendorNotes: {
    type: String
  },
  customerNotes: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
});

// Pre-save middleware to update the updatedAt field
saleOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to generate order number
saleOrderSchema.statics.generateOrderNumber = async function() {
  const count = await this.countDocuments();
  return `SO${String(count + 1).padStart(6, '0')}`;
};

// Method to calculate totals
saleOrderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
};

// Method to check if order can be cancelled
saleOrderSchema.methods.canBeCancelled = function() {
  return ['draft', 'confirmed', 'processing'].includes(this.status);
};

// Method to check if order can be refunded
saleOrderSchema.methods.canBeRefunded = function() {
  return ['delivered'].includes(this.status) && this.paymentStatus === 'paid';
};

module.exports = mongoose.model('SaleOrder', saleOrderSchema);
const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    rentalStartDate: {
      type: Date,
      required: true
    },
    rentalEndDate: {
      type: Date,
      required: true
    },
    rentalDuration: {
      value: Number,
      unit: { type: String, enum: ['hour', 'day', 'week', 'month'] }
    },
    pricePerUnit: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
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
  discountAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['coupon', 'promo', 'loyalty'],
    default: null
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'expired', 'cancelled', 'converted'],
    default: 'draft'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendorNotes: {
    type: String,
    trim: true
  },
  vendorAdjustedPricing: [{
    item: {
      type: mongoose.Schema.Types.ObjectId
    },
    adjustedPrice: Number,
    reason: String
  }],
  counterOffers: [{
    offeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    offeredByRole: {
      type: String,
      enum: ['customer', 'vendor'],
      required: true
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      pricePerUnit: Number,
      totalPrice: Number
    }],
    subtotal: Number,
    taxAmount: Number,
    totalAmount: Number,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  convertedToOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  notes: {
    type: String,
    trim: true
  },
  validUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate quotation number
quotationSchema.pre('save', async function(next) {
  if (this.isNew && !this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

quotationSchema.pre('validate', async function(next) {
  if (this.isNew && !this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);

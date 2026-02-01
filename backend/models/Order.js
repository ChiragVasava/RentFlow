const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'with_customer', 'returned', 'late'],
      default: 'pending'
    }
  }],
  subtotal: {
    type: Number,
    required: true
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
  securityDeposit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'picked_up', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  pickupDate: Date,
  returnDate: Date,
  actualReturnDate: Date,
  lateReturnFee: {
    type: Number,
    default: 0
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

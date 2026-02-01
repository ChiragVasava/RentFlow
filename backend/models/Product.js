const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  availabilityType: {
    type: String,
    enum: ['rent', 'sale', 'both'],
    default: 'rent',
    required: true
  },
  isRentable: {
    type: Boolean,
    default: true
  },
  isSellable: {
    type: Boolean,
    default: false
  },
  quantityOnHand: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  salesPrice: {
    type: Number,
    min: 0
  },
  rentalPricing: {
    hourly: { type: Number, min: 0 },
    daily: { type: Number, min: 0 },
    weekly: { type: Number, min: 0 },
    custom: [{
      duration: Number,
      unit: { type: String, enum: ['hour', 'day', 'week', 'month'] },
      price: Number
    }]
  },
  attributes: [{
    name: String,
    value: String
  }],
  variants: [{
    name: String,
    options: [String],
    priceModifier: Number
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: {
    brand: String,
    model: String,
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair'],
      default: 'good'
    },
    weight: String,
    dimensions: {
      length: String,
      width: String,
      height: String
    },
    color: String,
    material: String
  },
  tags: [String],
  taxRate: {
    type: Number,
    min: 0,
    max: 100
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reservations: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    quantity: Number,
    startDate: Date,
    endDate: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check availability
productSchema.methods.checkAvailability = function(quantity, startDate, endDate) {
  let reservedQuantity = 0;
  
  this.reservations.forEach(reservation => {
    const reservationStart = new Date(reservation.startDate);
    const reservationEnd = new Date(reservation.endDate);
    const checkStart = new Date(startDate);
    const checkEnd = new Date(endDate);
    
    // Check if dates overlap
    if (
      (checkStart >= reservationStart && checkStart <= reservationEnd) ||
      (checkEnd >= reservationStart && checkEnd <= reservationEnd) ||
      (checkStart <= reservationStart && checkEnd >= reservationEnd)
    ) {
      reservedQuantity += reservation.quantity;
    }
  });
  
  return this.quantityOnHand - reservedQuantity >= quantity;
};

module.exports = mongoose.model('Product', productSchema);

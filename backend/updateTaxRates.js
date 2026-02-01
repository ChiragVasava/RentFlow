const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const TAX_RATES = {
  'Electronics': 18,
  'Furniture': 12,
  'Entertainment': 18,
  'Transportation': 12,
  'Tools & Equipment': 18,
  'Party Supplies': 12
};

const updateProductTaxRates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    for (const product of products) {
      const taxRate = TAX_RATES[product.category] || 18;
      product.taxRate = taxRate;
      await product.save();
      console.log(`Updated ${product.name} - Category: ${product.category} - Tax Rate: ${taxRate}%`);
    }

    console.log('All products updated with tax rates!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    process.exit(1);
  }
};

updateProductTaxRates();

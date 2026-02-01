// Category-based tax rates (in percentage)
const TAX_RATES = {
  'Electronics': 18,
  'Furniture': 12,
  'Entertainment': 18,
  'Transportation': 12,
  'Tools & Equipment': 18,
  'Party Supplies': 12,
  'default': 18
};

// Helper function to get tax rate by category
const getTaxRateByCategory = (category) => {
  return TAX_RATES[category] || TAX_RATES['default'];
};

// Calculate tax for a single item
const calculateItemTax = (amount, taxRate) => {
  return (amount * taxRate) / 100;
};

// Calculate total tax for multiple items with different tax rates
const calculateTotalTax = (items) => {
  return items.reduce((total, item) => {
    const itemTax = calculateItemTax(item.totalPrice, item.taxRate);
    return total + itemTax;
  }, 0);
};

// Calculate weighted average tax rate
const calculateWeightedTaxRate = (items, subtotal) => {
  if (subtotal === 0) return TAX_RATES['default'];
  
  const totalTax = calculateTotalTax(items);
  return (totalTax / subtotal) * 100;
};

module.exports = {
  TAX_RATES,
  getTaxRateByCategory,
  calculateItemTax,
  calculateTotalTax,
  calculateWeightedTaxRate
};

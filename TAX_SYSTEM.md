# Category-Based Tax System

## Overview
The rental application now implements a category-based tax system where different product categories have different GST tax rates applied.

## Tax Rates by Category

| Category | Tax Rate |
|----------|----------|
| Electronics | 18% |
| Entertainment | 18% |
| Tools & Equipment | 18% |
| Furniture | 12% |
| Transportation | 12% |
| Party Supplies | 12% |
| Default (Others) | 18% |

## How It Works

### 1. Product Level
- Each product now has a `taxRate` field that stores the applicable tax percentage
- When products are created or updated, they can have a custom tax rate
- If no custom rate is set, the system uses the category-based rate from the TAX_RATES configuration

### 2. Quotation Level
- When a quotation is created, each item's tax rate is determined from:
  1. Product's custom `taxRate` field (if set)
  2. Category-based rate from TAX_RATES constant
  3. Default 18% if category not found
- Tax is calculated individually for each item
- A weighted average tax rate is calculated and stored for display purposes
- Individual item tax rates and categories are stored in quotation items

### 3. Order Level
- Orders inherit the tax calculation from the quotation
- Tax amounts are carried forward from the quotation

### 4. Invoice Level
- Invoices recalculate taxes based on individual product categories
- Each invoice item stores:
  - `taxRate`: The tax rate applied to that specific item
  - `category`: The product category
- Total tax is calculated as the sum of individual item taxes
- A weighted average tax rate is displayed in the invoice summary
- Tax breakdown shows CGST and SGST (each half of the total tax rate)

## Tax Display

### Invoice Details
- **Items Table**: Shows each product with its category and applicable tax rate
- **Summary Section**: 
  - Displays CGST and SGST percentages (calculated from weighted average)
  - Shows tax amounts in rupees
  - If items have different tax rates, the percentages shown are weighted averages

### Example Calculation

**Order with mixed categories:**
- Product A (Electronics): ₹10,000 @ 18% = ₹1,800 tax
- Product B (Furniture): ₹5,000 @ 12% = ₹600 tax

**Total:**
- Subtotal: ₹15,000
- Total Tax: ₹2,400
- Weighted Tax Rate: (2,400/15,000) × 100 = 16%
- CGST: ₹1,200 (8%)
- SGST: ₹1,200 (8%)
- Grand Total: ₹17,400

## Configuration

Tax rates can be modified in:
- `backend/utils/taxCalculator.js` - Centralized tax configuration
- `backend/controllers/invoiceController.js` - TAX_RATES constant
- `backend/controllers/quotationController.js` - TAX_RATES constant

## Database Updates

All existing products have been updated with appropriate tax rates based on their categories using the `updateTaxRates.js` script.

## Benefits

1. **Compliance**: Different product categories can have legally compliant tax rates
2. **Flexibility**: Individual products can have custom tax rates if needed
3. **Accuracy**: Taxes are calculated per item, ensuring precise amounts
4. **Transparency**: Invoices clearly show which tax rate applies to each product
5. **Scalability**: Easy to add new categories or modify existing rates

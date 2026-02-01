# Sale Orders - Quick Start Guide

## For Vendors

### Creating a Sale Order

1. **Access the Feature**
   - Click "Sale Orders" in the top navigation bar
   - Click the "Create Sale Order" button

2. **Fill Out the Form**
   
   **Step 1: Select Customer**
   - Choose customer from the dropdown
   - Address will auto-populate

   **Step 2: Add Items**
   - Select product from dropdown
   - Enter quantity
   - Price will auto-fill (you can adjust if needed)
   - Click "+ Add Item" to add more products
   - Review the order summary (subtotal, tax, total)

   **Step 3: Delivery Details**
   - Verify/edit shipping address
   - Check "same as shipping" for billing address or enter different one
   - Set expected delivery date
   - Choose payment method

   **Step 4: Add Notes (Optional)**
   - Enter any special instructions or terms

   **Step 5: Submit**
   - Click "Create Sale Order"
   - You'll be redirected to the order details

3. **Manage Orders**
   - View all your orders in the list
   - Use filters to find specific orders
   - Click "View" to see details and update status
   - Track payment and delivery

### Updating Order Status

1. Go to sale order details
2. Click "Update Status"
3. Select new status:
   - **Confirmed** → Order accepted
   - **Processing** → Preparing the order
   - **Shipped** → Order sent (add tracking number)
   - **Delivered** → Customer received
4. Add notes if needed
5. Click "Update"

---

## For Customers

### Viewing Your Sale Orders

1. **Access Your Orders**
   - Click on your profile circle (top right)
   - Select "Sale Orders" from dropdown
   OR
   - Navigate to the main "Sale Orders" link

2. **View Order Details**
   - Click on any order card
   - See full order information:
     - Items and quantities
     - Prices and totals
     - Delivery address
     - Expected delivery date
     - Current status
     - Payment status
     - Tracking information (if shipped)

3. **Track Your Order**
   - Check order status in the details page
   - Statuses you'll see:
     - **Draft** → Order created, awaiting vendor confirmation
     - **Confirmed** → Vendor accepted your order
     - **Processing** → Being prepared
     - **Shipped** → On the way
     - **Delivered** → Received
     - **Cancelled** → Order cancelled

4. **Cancel Order** (If Needed)
   - Available for draft/confirmed orders only
   - Click "Cancel Order" button
   - Provide a reason
   - Confirm cancellation

---

## Key Features

### Order Information Includes:
- ✅ Unique order number
- ✅ Complete item list with prices
- ✅ Subtotal, tax, and total amounts
- ✅ Shipping and billing addresses
- ✅ Expected delivery date
- ✅ Payment method
- ✅ Order notes and special instructions
- ✅ Current status and payment status
- ✅ Tracking number (when shipped)
- ✅ Timeline of status changes

### What You Can Do:

**Vendors:**
- Create orders for customers
- Update order status
- Update payment status
- Add tracking numbers
- Cancel orders
- Create invoices from orders

**Customers:**
- View all orders
- Track order progress
- See payment status
- Cancel draft/confirmed orders
- View order history

---

## Status Reference

### Order Status
| Status | Meaning | Can Update |
|--------|---------|------------|
| Draft | Created, awaiting confirmation | Vendor |
| Confirmed | Accepted by vendor | Vendor |
| Processing | Being prepared | Vendor |
| Shipped | Dispatched to customer | Vendor |
| Delivered | Received by customer | Vendor |
| Cancelled | Order cancelled | Both |

### Payment Status
| Status | Meaning |
|--------|---------|
| Pending | No payment received |
| Partial | Some amount paid |
| Paid | Fully paid |
| Refunded | Money returned |
| Failed | Payment unsuccessful |

---

## Tips & Best Practices

### For Vendors:
1. ✅ Always verify customer details before creating order
2. ✅ Check inventory before confirming
3. ✅ Set realistic delivery dates
4. ✅ Update status promptly when changes occur
5. ✅ Add tracking numbers when shipping
6. ✅ Communicate with customers about delays
7. ✅ Create invoices after delivery confirmation

### For Customers:
1. ✅ Review order details carefully
2. ✅ Check expected delivery date
3. ✅ Monitor order status regularly
4. ✅ Report issues promptly
5. ✅ Confirm delivery when received
6. ✅ Keep order numbers for reference

---

## Common Questions

**Q: Can I edit an order after creation?**
A: Only draft orders can be deleted. Contact the vendor for changes to confirmed orders.

**Q: How do I know my order was shipped?**
A: You'll see the status change to "Shipped" and a tracking number will be provided.

**Q: What if I need to cancel?**
A: Use the "Cancel Order" button in order details. Orders can typically be cancelled before shipping.

**Q: When should I expect delivery?**
A: Check the "Expected Delivery Date" in your order details.

**Q: How do I pay for my order?**
A: Payment details are coordinated with the vendor based on the payment method selected.

**Q: Can I order from multiple vendors?**
A: Each order must be from a single vendor. Create separate orders for different vendors.

---

## Need Help?

- Check the main documentation: `SALE_ORDERS_IMPLEMENTATION.md`
- Contact your vendor directly for order-specific questions
- Report technical issues to support

---

**Quick Access Links:**
- Vendors: `/vendor/sale-orders`
- Create Order: `/vendor/sale-orders/create`
- Customers: `/sale-orders`
- Order Details: `/sale-orders/:id`

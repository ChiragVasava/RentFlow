const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

const generateOrderId = (index) => {
    return `S${String(index).padStart(5, '0')}`;
};

const seedOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get users and products
        const customers = await User.find({ role: 'customer' });
        const vendors = await User.find({ role: 'vendor' });
        const products = await Product.find({}).limit(20);

        if (customers.length === 0 || vendors.length === 0 || products.length === 0) {
            console.log('❌ No customers, vendors, or products found. Please run seedData.js first.');
            process.exit(1);
        }

        // Clear existing orders
        await Order.deleteMany({});
        console.log('Cleared existing orders');

        const statuses = ['quotation', 'sale_order', 'confirmed', 'invoiced', 'cancelled'];
        const orders = [];

        // Create 15 demo orders
        for (let i = 1; i <= 15; i++) {
            const customer = customers[i % customers.length];
            const vendor = vendors[i % vendors.length];
            const product = products[i % products.length];
            const status = statuses[i % statuses.length];

            const rentalStartDate = new Date();
            rentalStartDate.setDate(rentalStartDate.getDate() + Math.floor(Math.random() * 7));

            const rentalEndDate = new Date(rentalStartDate);
            rentalEndDate.setDate(rentalEndDate.getDate() + (Math.floor(Math.random() * 5) + 1));

            const returnDate = new Date(rentalEndDate);

            // For some orders, make return date approaching or passed
            if (i % 3 === 0) {
                returnDate.setDate(returnDate.getDate() - 2); // Already passed
            } else if (i % 4 === 0) {
                returnDate.setHours(returnDate.getHours() + 12); // Approaching (within 1 day)
            }

            const pricePerUnit = product.rentalPricing?.daily || 100;
            const quantity = Math.floor(Math.random() * 3) + 1;
            const totalPrice = pricePerUnit * quantity;
            const taxAmount = totalPrice * 0.18;
            const totalAmount = totalPrice + taxAmount;

            const order = {
                orderNumber: `ORD${String(i).padStart(6, '0')}`,
                orderId: generateOrderId(i),
                customer: customer._id,
                vendor: vendor._id,
                items: [{
                    product: product._id,
                    quantity: quantity,
                    rentalStartDate: rentalStartDate,
                    rentalEndDate: rentalEndDate,
                    rentalDuration: {
                        value: Math.ceil((rentalEndDate - rentalStartDate) / (1000 * 60 * 60 * 24)),
                        unit: 'day'
                    },
                    pricePerUnit: pricePerUnit,
                    totalPrice: totalPrice,
                    status: 'pending'
                }],
                subtotal: totalPrice,
                taxAmount: taxAmount,
                totalAmount: totalAmount,
                status: status,
                paymentStatus: status === 'invoiced' ? 'paid' : (status === 'confirmed' ? 'partial' : 'pending'),
                isPaid: status === 'invoiced',
                returnDate: returnDate,
                pickupDate: rentalStartDate,
                securityDeposit: totalAmount * 0.1,
                createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000) // Spread over last 15 days
            };

            orders.push(order);
        }

        // Insert all orders
        const createdOrders = await Order.insertMany(orders);
        console.log(`\n✅ Created ${createdOrders.length} demo orders`);

        // Show summary
        const statusCounts = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        console.log('\n📊 Order Status Summary:');
        statusCounts.forEach(item => {
            console.log(`   ${item._id}: ${item.count}`);
        });

        console.log('\n✅ Demo orders seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
};

seedOrders();

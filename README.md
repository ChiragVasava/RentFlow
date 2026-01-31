# 🌊 RentFlow - Complete Rental Management System

A modern, comprehensive rental management platform built with the MERN stack, featuring an ERP-style interface for managing products, orders, invoices, and more.

## ✨ Features

### For Customers
- 🔍 Browse and search rental products with advanced filters
- 🛒 Shopping cart and checkout system
- 📅 Flexible rental duration (hourly, daily, weekly)
- 📊 Order tracking and history
- 💳 Invoice management
- ⭐ Product ratings and reviews

### For Vendors
- 📦 Product management with ERP-style forms
- 📸 Multiple image upload for products
- 📈 Sales analytics dashboard
- 📋 Order management and fulfillment
- 💰 Revenue tracking
- 🏷️ Category and inventory management

### For Admins
- 👥 User management (customers, vendors, admins)
- 🎛️ System-wide dashboard with analytics
- ✅ Product approval and publishing
- 📊 Revenue and performance reports
- ⚙️ System settings and configuration

## 🚀 Tech Stack

- **Frontend**: React 18.2.0, React Router, React Icons, React Toastify
- **Backend**: Node.js, Express 4.18.2
- **Database**: MongoDB with Mongoose 7.0.3
- **Authentication**: JWT with Bcrypt password hashing
- **Styling**: Custom CSS with modern, minimal design

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/RentFlow.git
   cd RentFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ..
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/rental-management
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   ```

4. **Seed Sample Data**
   ```bash
   npm run seed
   ```
   This creates:
   - 1 Admin user
   - 5 Vendor users
   - 3 Customer users
   - 48 Products across 9 categories

5. **Run the Application**
   ```bash
   npm run dev
   ```
   
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🔐 Default Login Credentials

### Admin Account
- **Email**: admin@rentalapp.com
- **Password**: admin123

### Vendor Accounts
- vendor1@rentalapp.com - vendor123
- vendor2@rentalapp.com - vendor123
- vendor3@rentalapp.com - vendor123
- vendor4@rentalapp.com - vendor123
- vendor5@rentalapp.com - vendor123

### Customer Accounts
- customer1@rentalapp.com - customer123
- customer2@rentalapp.com - customer123
- customer3@rentalapp.com - customer123

## 📁 Project Structure

```
RentFlow/
├── backend/
│   ├── controllers/      # Route controllers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── seedData.js      # Sample data script
│   └── server.js        # Express server
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context (Auth, Cart)
│       ├── pages/       # Page components
│       ├── utils/       # API utilities
│       └── App.js       # Main app component
└── package.json         # Root dependencies
```

## 🎨 Key Features

### ERP-Style Product Management
- Two-panel layout (General Info + Attributes)
- Image upload with preview
- Product type selection (Goods/Service)
- Dynamic pricing (hourly, daily, weekly)
- Specifications and attributes management
- Publish/unpublish toggle

### Advanced Product Catalog
- 48 pre-seeded products across categories:
  - Electronics (cameras, laptops, tablets)
  - Event Equipment (projectors, sound systems)
  - Outdoor & Sports (tents, bikes, kayaks)
  - Party Supplies (tables, decorations)
  - Tools & Equipment (drills, generators)
  - Transportation (cars, bikes)
  - Entertainment (gaming consoles, cameras)
  - Furniture (chairs, tables)

### Professional Dashboard
- Role-based dashboards for Admin, Vendor, and Customer
- Real-time analytics and metrics
- Order and revenue tracking
- User activity monitoring

## 🔧 Available Scripts

- `npm run dev` - Run both frontend and backend concurrently
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run seed` - Populate database with sample data

## 📦 API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create product (Vendor/Admin)
- PUT `/api/products/:id` - Update product (Vendor/Admin)
- DELETE `/api/products/:id` - Delete product (Vendor/Admin)

### Orders
- GET `/api/orders` - Get all orders
- GET `/api/orders/:id` - Get single order
- POST `/api/orders` - Create order
- PUT `/api/orders/:id/status` - Update order status

### Users (Admin only)
- GET `/api/users` - Get all users
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ using the MERN stack

## 🙏 Acknowledgments

- React Icons for beautiful icons
- Unsplash for product images
- MongoDB for the database
- Express.js for the backend framework

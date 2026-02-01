import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import MyOrders from './pages/MyOrders';
import Quotations from './pages/Quotations';
import QuotationDetails from './pages/QuotationDetails';
import QuotationEdit from './pages/QuotationEdit';
import SaleOrders from './pages/SaleOrders';
import SaleOrderDetails from './pages/SaleOrderDetails';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import Profile from './pages/Profile';
import ManageProducts from './pages/vendor/ManageProducts';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorQuotations from './pages/VendorQuotations';
import VendorSaleOrders from './pages/vendor/VendorSaleOrders';
import CreateSaleOrder from './pages/vendor/CreateSaleOrder';
import VendorPickups from './pages/vendor/VendorPickups';
import VendorReturns from './pages/vendor/VendorReturns';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import Settings from './pages/admin/Settings';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/ProductForm';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />

            <Route path="/reset-password/:token" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } />

            {/* Protected Routes - All Authenticated Users */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />

            <Route path="/quotations" element={
              <ProtectedRoute>
                <Quotations />
              </ProtectedRoute>
            } />

            <Route path="/quotations/:id" element={
              <ProtectedRoute>
                <QuotationDetails />
              </ProtectedRoute>
            } />

            <Route path="/quotations/:id/edit" element={
              <ProtectedRoute>
                <QuotationEdit />
              </ProtectedRoute>
            } />

            <Route path="/orders" element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            } />

            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } />

            <Route path="/sale-orders" element={
              <ProtectedRoute>
                <SaleOrders />
              </ProtectedRoute>
            } />

            <Route path="/sale-orders/:id" element={
              <ProtectedRoute>
                <SaleOrderDetails />
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            } />

            <Route path="/invoices/:id" element={
              <ProtectedRoute>
                <InvoiceDetails />
              </ProtectedRoute>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor/products" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <ManageProducts />
              </ProtectedRoute>
            } />

            <Route path="/vendor/products/new" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <ProductForm />
              </ProtectedRoute>
            } />

            <Route path="/vendor/products/edit/:id" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <ProductForm />
              </ProtectedRoute>
            } />

            <Route path="/vendor/quotations" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorQuotations />
              </ProtectedRoute>
            } />

            <Route path="/vendor/orders" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorOrders />
              </ProtectedRoute>
            } />

            <Route path="/vendor/sale-orders" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorSaleOrders />
              </ProtectedRoute>
            } />

            <Route path="/vendor/sale-orders/create" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <CreateSaleOrder />
              </ProtectedRoute>
            } />

            <Route path="/vendor/pickups" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorPickups />
              </ProtectedRoute>
            } />

            <Route path="/vendor/pickups/:id" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorPickups />
              </ProtectedRoute>
            } />

            <Route path="/vendor/returns" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorReturns />
              </ProtectedRoute>
            } />

            <Route path="/vendor/returns/:id" element={
              <ProtectedRoute roles={['vendor', 'admin']}>
                <VendorReturns />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            } />

            <Route path="/admin/products" element={
              <ProtectedRoute roles={['admin']}>
                <AdminProducts />
              </ProtectedRoute>
            } />

            <Route path="/admin/settings" element={
              <ProtectedRoute roles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

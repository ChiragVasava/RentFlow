import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, productsAPI } from '../../utils/api';
import { 
  FaBox, FaFileInvoiceDollar, FaShoppingCart, FaClock, FaEye, 
  FaChartLine, FaTruck, FaCheckCircle, FaStore, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import './VendorDashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real stats
      const response = await dashboardAPI.getStats();
      setStats(response.data.stats);
      
      // Fetch vendor's products
      const productsRes = await productsAPI.getMyProducts();
      const products = productsRes.data.products || [];
      
      // Calculate category distribution
      const catMap = {};
      products.forEach(p => {
        const cat = p.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      
      const catData = Object.entries(catMap).map(([name, value]) => ({
        name,
        value
      }));
      setCategoryData(catData);
      
      // Generate sample data for demonstration
      generateSampleData(products);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (products) => {
    // Generate last 6 months revenue data (sample)
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const revenue = months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 20000,
      orders: Math.floor(Math.random() * 30) + 10
    }));
    setRevenueData(revenue);
    
    // Generate top rented products (sample based on real products)
    const topProds = products.slice(0, 5).map((product, index) => ({
      name: product.name,
      rentals: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 30000) + 5000,
      image: product.images?.[0]?.url || product.images?.[0] || 'https://via.placeholder.com/150'
    }));
    setTopProducts(topProds);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-icon spinning">
          <FaStore />
        </div>
        <p>Loading Your Dashboard...</p>
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const avgOrderValue = totalRevenue / (stats?.totalOrders || 1);
  const growthRate = revenueData.length >= 2 
    ? ((revenueData[revenueData.length - 1].revenue - revenueData[revenueData.length - 2].revenue) / revenueData[revenueData.length - 2].revenue * 100).toFixed(1)
    : 0;

  return (
    <div className="vendor-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaStore /> Vendor Dashboard
          </h1>
          <p className="page-subtitle">Welcome back, {user?.name}! Here's your business overview.</p>
        </div>
        <Link to="/vendor/products" className="btn btn-primary">
          <FaBox /> Manage Products
        </Link>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <Link to="/invoices" className="metric-card metric-revenue clickable">
          <div className="metric-header">
            <div className="metric-icon">
              <FaFileInvoiceDollar />
            </div>
            <span className={`metric-trend ${growthRate >= 0 ? 'positive' : 'negative'}`}>
              {growthRate >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(growthRate)}%
            </span>
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Revenue (6 months)</p>
            <p className="metric-value">₹{totalRevenue.toLocaleString()}</p>
            <p className="metric-subtext">View detailed invoices →</p>
          </div>
        </Link>

        <Link to="/vendor/products" className="metric-card metric-products clickable">
          <div className="metric-header">
            <div className="metric-icon">
              <FaBox />
            </div>
          </div>
          <div className="metric-content">
            <p className="metric-label">Your Products</p>
            <p className="metric-value">{stats?.publishedProducts || 0}</p>
            <p className="metric-subtext">
              Manage products →
            </p>
          </div>
        </Link>

        <Link to="/orders" className="metric-card metric-orders clickable">
          <div className="metric-header">
            <div className="metric-icon">
              <FaShoppingCart />
            </div>
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Orders</p>
            <p className="metric-value">{stats?.totalOrders || 0}</p>
            <p className="metric-subtext">View all orders →</p>
          </div>
        </Link>

        <div className="metric-card metric-active">
          <div className="metric-header">
            <div className="metric-icon">
              <FaTruck />
            </div>
          </div>
          <div className="metric-content">
            <p className="metric-label">Currently Rented</p>
            <p className="metric-value">{stats?.activeRentals || 0}</p>
            <p className="metric-subtext">Active rentals in the field</p>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {stats?.pendingProducts > 0 && (
        <div className="notification-banner">
          <FaClock />
          <div>
            <strong>Products Awaiting Approval</strong>
            <p>
              You have {stats.pendingProducts} product(s) pending admin approval. 
              <Link to="/vendor/products" className="link-inline"> View Products →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-section">
        {/* Revenue Trend */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <h3 className="chart-title">
              <FaChartLine /> Revenue & Orders Trend
            </h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot revenue"></span> Revenue
              </span>
              <span className="legend-item">
                <span className="legend-dot orders"></span> Orders
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#2c5f7e" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value, name) => {
                  if (name === 'revenue') return `₹${value.toLocaleString()}`;
                  return value;
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#2c5f7e" 
                strokeWidth={3}
                dot={{ fill: '#2c5f7e', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">
              <FaBox /> Product Categories
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products Section */}
      {topProducts.length > 0 && (
        <div className="top-products-section card">
          <h3 className="section-title">
            <FaChartLine /> Most Rented Products
          </h3>
          <div className="top-products-grid">
            {topProducts.map((product, index) => (
              <div key={index} className="top-product-card">
                <div className="product-rank">#{index + 1}</div>
                <img src={product.image} alt={product.name} className="product-image" />
                <div className="product-info">
                  <h4 className="product-name">{product.name}</h4>
                  <div className="product-stats">
                    <div className="stat-item">
                      <FaShoppingCart />
                      <span>{product.rentals} rentals</span>
                    </div>
                    <div className="stat-item revenue">
                      <FaFileInvoiceDollar />
                      <span>₹{product.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="recent-activity-section card">
          <div className="section-header">
            <h3 className="section-title">
              <FaClock /> Recent Orders
            </h3>
            <Link to="/vendor/orders" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/orders/${order._id}`} className="order-link">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.customer?.name || 'N/A'}</td>
                    <td>{order.items?.length} items</td>
                    <td className="amount-cell">₹{order.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <div className="action-buttons-grid">
          <Link to="/vendor/products" className="action-card">
            <FaBox />
            <span>Manage Products</span>
            <small>{stats?.totalProducts || 0} products</small>
          </Link>
          <Link to="/vendor/orders" className="action-card">
            <FaShoppingCart />
            <span>View Orders</span>
            <small>{stats?.totalOrders || 0} orders</small>
          </Link>
          <Link to="/invoices" className="action-card">
            <FaFileInvoiceDollar />
            <span>Invoices</span>
            <small>Manage billing</small>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

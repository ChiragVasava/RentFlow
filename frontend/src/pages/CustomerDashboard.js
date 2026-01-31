import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../utils/api';
import { FaBox, FaFileInvoiceDollar, FaShoppingCart, FaClock } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Link to="/orders" className="stat-card clickable">
          <div className="stat-icon primary">
            <FaShoppingCart />
          </div>
          <div>
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{stats?.totalOrders || 0}</p>
            <p className="stat-subtext">View all orders →</p>
          </div>
        </Link>

        <Link to="/orders" className="stat-card clickable">
          <div className="stat-icon success">
            <FaClock />
          </div>
          <div>
            <p className="stat-label">Active Rentals</p>
            <p className="stat-value">{stats?.activeRentals || 0}</p>
            <p className="stat-subtext">View rentals →</p>
          </div>
        </Link>

        <Link to="/invoices" className="stat-card clickable">
          <div className="stat-icon warning">
            <FaFileInvoiceDollar />
          </div>
          <div>
            <p className="stat-label">Total Spent</p>
            <p className="stat-value">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
            <p className="stat-subtext">View invoices →</p>
          </div>
        </Link>

        <Link to="/invoices" className="stat-card clickable">
          <div className="stat-icon danger">
            <FaBox />
          </div>
          <div>
            <p className="stat-label">Pending Payments</p>
            <p className="stat-value">₹{stats?.pendingAmount?.toLocaleString() || 0}</p>
            <p className="stat-subtext">View invoices →</p>
          </div>
        </Link>
      </div>

      {/* Revenue Chart */}
      {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
        <div className="card">
          <h3 className="card-title">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="_id.month" 
                tickFormatter={(value) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[value - 1];
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₹${value.toLocaleString()}`}
                labelFormatter={(value) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[value - 1];
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#2c5f7e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Orders */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="card">
          <div className="card-header-flex">
            <h3 className="card-title">Recent Orders</h3>
            <Link to="/orders" className="btn btn-secondary">View All</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
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
                      <Link to={`/orders/${order._id}`} className="text-primary">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.items?.length} items</td>
                    <td>₹{order.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(order.status)}`}>
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
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
          <Link to="/cart" className="btn btn-secondary">View Cart</Link>
          <Link to="/quotations" className="btn btn-outline">My Quotations</Link>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const statusColors = {
    draft: 'secondary',
    confirmed: 'primary',
    processing: 'warning',
    picked_up: 'info',
    active: 'success',
    completed: 'success',
    cancelled: 'danger'
  };
  return statusColors[status] || 'secondary';
};

export default CustomerDashboard;

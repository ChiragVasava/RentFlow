import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaBox, FaCheckCircle, FaEye, FaEyeSlash, FaSpinner, FaStore, 
  FaUsers, FaShoppingCart, FaChartLine, FaClock, FaBan, FaUserShield
} from 'react-icons/fa';
import { productsAPI, dashboardAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './AdminDashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashboard = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'published'
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    pendingProducts: 0,
    totalVendors: 0,
    totalUsers: 0,
    totalOrders: 0
  });
  const [vendorStats, setVendorStats] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchSystemStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      const products = response.data.products || [];
      setAllProducts(products);
      
      const unpublished = products.filter(p => !p.isPublished);
      setPendingProducts(unpublished);
      
      // Calculate vendor stats
      const vendorMap = {};
      products.forEach(p => {
        const vendorId = p.vendor?._id || p.vendor;
        const vendorName = p.vendor?.name || 'Unknown';
        
        if (!vendorMap[vendorId]) {
          vendorMap[vendorId] = {
            name: vendorName,
            total: 0,
            published: 0,
            pending: 0
          };
        }
        
        vendorMap[vendorId].total++;
        if (p.isPublished) {
          vendorMap[vendorId].published++;
        } else {
          vendorMap[vendorId].pending++;
        }
      });
      
      setVendorStats(Object.values(vendorMap));
      
      setStats(prev => ({
        ...prev,
        totalProducts: products.length,
        publishedProducts: products.filter(p => p.isPublished).length,
        pendingProducts: unpublished.length,
        totalVendors: Object.keys(vendorMap).length
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchSystemStats = async () => {
    try {
      // This would come from a backend API endpoint for admin stats
      // For now, we'll use mock data
      setStats(prev => ({
        ...prev,
        totalUsers: 45,
        totalOrders: 128
      }));
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handlePublish = async (productId) => {
    if (!window.confirm('Publish this product and make it visible to customers?')) {
      return;
    }

    try {
      setPublishingId(productId);
      await productsAPI.update(productId, { isPublished: true });
      toast.success('✅ Product published successfully! Vendor has been notified.');
      await fetchProducts();
    } catch (error) {
      console.error('Error publishing product:', error);
      toast.error('Failed to publish product');
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (productId) => {
    if (!window.confirm('Unpublish this product and hide it from customers?')) {
      return;
    }

    try {
      setPublishingId(productId);
      await productsAPI.update(productId, { isPublished: false });
      toast.success('Product unpublished successfully');
      await fetchProducts();
    } catch (error) {
      console.error('Error unpublishing product:', error);
      toast.error('Failed to unpublish product');
    } finally {
      setPublishingId(null);
    }
  };

  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.isPrimary);
      return primary?.url || product.images[0]?.url || product.images[0] || 'https://via.placeholder.com/150';
    }
    return 'https://via.placeholder.com/150';
  };

  const categoryData = allProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner-icon" />
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const displayProducts = activeTab === 'pending' ? pendingProducts : allProducts.filter(p => p.isPublished);

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaUserShield /> Admin Dashboard
          </h1>
          <p className="page-subtitle">System Management & Product Oversight</p>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="stats-grid">
        <Link to="/admin/users" className="stat-card stat-users clickable">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{stats.totalUsers}</p>
            <span className="stat-subtext">View all users →</span>
          </div>
        </Link>

        <div className="stat-card stat-vendors clickable" onClick={() => window.location.href = '/products'}>
          <div className="stat-icon">
            <FaStore />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Vendors</p>
            <p className="stat-value">{stats.totalVendors}</p>
            <span className="stat-subtext">{stats.totalProducts} products</span>
          </div>
        </div>

        <Link to="/products" className="stat-card stat-products clickable">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <p className="stat-label">Published Products</p>
            <p className="stat-value">{stats.publishedProducts}</p>
            <span className="stat-subtext">View products →</span>
          </div>
        </Link>

        <div className="stat-card stat-pending clickable" onClick={() => setActiveTab('pending')}>
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Approval</p>
            <p className="stat-value">{stats.pendingProducts}</p>
            <span className="stat-subtext">Review now →</span>
          </div>
        </div>

        <Link to="/orders" className="stat-card stat-orders clickable">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{stats.totalOrders}</p>
            <span className="stat-subtext">View orders →</span>
          </div>
        </Link>

        <div className="stat-card stat-ratio">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <p className="stat-label">Approval Rate</p>
            <p className="stat-value">
              {stats.totalProducts > 0 
                ? Math.round((stats.publishedProducts / stats.totalProducts) * 100) 
                : 0}%
            </p>
            <span className="stat-subtext">Published products</span>
          </div>
        </div>
      </div>

      {/* Pending Products Alert */}
      {stats.pendingProducts > 0 && (
        <div className="alert-banner">
          <FaClock />
          <div>
            <strong>Action Required!</strong>
            <p>You have {stats.pendingProducts} product(s) waiting for your approval to go live.</p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="card-title">
            <FaStore /> Products by Vendor
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorStats.slice(0, 5)} margin={{ top: 5, right: 20, bottom: 80, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="published" fill="#00C49F" name="Published" />
              <Bar dataKey="pending" fill="#FFBB28" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="card-title">
            <FaBox /> Products by Category
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
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
      </div>

      {/* Products Management Section */}
      <div className="products-section card">
        <div className="section-header">
          <h2 className="section-title">
            <FaBox /> Product Management
          </h2>
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <FaClock /> Pending ({pendingProducts.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              <FaCheckCircle /> Published ({stats.publishedProducts})
            </button>
          </div>
        </div>

        {displayProducts.length === 0 ? (
          <div className="empty-state">
            <FaBox className="empty-icon" />
            <h3>No {activeTab === 'pending' ? 'Pending' : 'Published'} Products</h3>
            <p>
              {activeTab === 'pending' 
                ? 'All products have been reviewed!' 
                : 'No products have been published yet.'}
            </p>
          </div>
        ) : (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <img 
                          src={getPrimaryImage(product)} 
                          alt={product.name}
                          className="product-thumb"
                        />
                        <div>
                          <div className="product-name">{product.name}</div>
                          <div className="product-id">ID: {product._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vendor-cell">
                        <FaStore />
                        {product.vendor?.name || 'Unknown'}
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td className="price-cell">₹{product.salesPrice?.toLocaleString()}</td>
                    <td>
                      <span className={`stock-badge ${product.quantityOnHand < 5 ? 'low' : ''}`}>
                        {product.quantityOnHand} units
                      </span>
                    </td>
                    <td>
                      {product.isPublished ? (
                        <span className="status-badge published">
                          <FaEye /> Published
                        </span>
                      ) : (
                        <span className="status-badge pending">
                          <FaClock /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {product.isPublished ? (
                          <button
                            className="btn-action btn-unpublish"
                            onClick={() => handleUnpublish(product._id)}
                            disabled={publishingId === product._id}
                          >
                            {publishingId === product._id ? (
                              <FaSpinner className="spinning" />
                            ) : (
                              <>
                                <FaBan /> Unpublish
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="btn-action btn-publish"
                            onClick={() => handlePublish(product._id)}
                            disabled={publishingId === product._id}
                          >
                            {publishingId === product._id ? (
                              <FaSpinner className="spinning" />
                            ) : (
                              <>
                                <FaCheckCircle /> Publish
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <div className="action-buttons-grid">
          <Link to="/admin/users" className="action-card">
            <FaUsers />
            <span>Manage Users</span>
          </Link>
          <Link to="/admin/settings" className="action-card">
            <FaUserShield />
            <span>System Settings</span>
          </Link>
          <Link to="/products" className="action-card">
            <FaBox />
            <span>View All Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

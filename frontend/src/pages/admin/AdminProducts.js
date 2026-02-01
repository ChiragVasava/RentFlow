import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  FaBox, FaEye, FaEyeSlash, FaTrash, FaSpinner, FaSearch, FaFilter,
  FaCheckCircle, FaTimesCircle, FaStore
} from 'react-icons/fa';
import { productsAPI } from '../../utils/api';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'unpublished'
  const [vendorFilter, setVendorFilter] = useState('all');
  const [vendors, setVendors] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      const productsData = response.data.products || response.data;
      setProducts(productsData);
      
      // Extract unique vendors
      const uniqueVendors = [...new Set(productsData.map(p => p.vendor?.name || p.vendor?.companyName).filter(Boolean))];
      setVendors(uniqueVendors);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (statusFilter === 'published') return product.isPublished;
        if (statusFilter === 'unpublished') return !product.isPublished;
        return true;
      });
    }

    // Vendor filter
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(product =>
        (product.vendor?.name === vendorFilter) || 
        (product.vendor?.companyName === vendorFilter)
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter, vendorFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleTogglePublishStatus = async (productId, currentStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [productId]: true }));
      
      const action = currentStatus ? 'unpublish' : 'publish';
      await productsAPI.update(productId, { isPublished: !currentStatus });
      
      toast.success(`Product ${action}ed successfully`);
      fetchProducts();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update product status');
    } finally {
      setActionLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [productId]: true }));
      
      await productsAPI.delete(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setActionLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.images[0];
    }
    return 'https://via.placeholder.com/80x80?text=No+Image';
  };

  const getStatusBadge = (isPublished) => {
    return isPublished ? (
      <span className="status-badge status-published">
        <FaCheckCircle /> Published
      </span>
    ) : (
      <span className="status-badge status-unpublished">
        <FaTimesCircle /> Unpublished
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <FaSpinner className="fa-spin" /> Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaStore /> Product Management
        </h1>
        <p className="page-subtitle">
          Manage all products in the system - publish, unpublish, or delete products
        </p>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FaBox />
          </div>
          <div>
            <p className="stat-label">Total Products</p>
            <p className="stat-value">{products.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <FaCheckCircle />
          </div>
          <div>
            <p className="stat-label">Published</p>
            <p className="stat-value">{products.filter(p => p.isPublished).length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <FaTimesCircle />
          </div>
          <div>
            <p className="stat-label">Unpublished</p>
            <p className="stat-value">{products.filter(p => !p.isPublished).length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <FaStore />
          </div>
          <div>
            <p className="stat-label">Vendors</p>
            <p className="stat-value">{vendors.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products, vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <FaFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h3>Products ({filteredProducts.length})</h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <FaBox className="empty-icon" />
            <h3>No products found</h3>
            <p>No products match your current filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Price Range</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-info">
                        <img
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          className="product-thumbnail"
                        />
                        <div className="product-details">
                          <h4>{product.name}</h4>
                          <p className="product-description">
                            {product.description?.substring(0, 60)}
                            {product.description?.length > 60 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vendor-info">
                        <strong>{product.vendor?.name || product.vendor?.companyName}</strong>
                        <br />
                        <small>{product.vendor?.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{product.category}</span>
                    </td>
                    <td>
                      <div className="price-range">
                        {product.rentalPricing?.hourly && (
                          <div>₹{product.rentalPricing.hourly}/hr</div>
                        )}
                        {product.rentalPricing?.daily && (
                          <div>₹{product.rentalPricing.daily}/day</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`stock-badge ${product.quantityOnHand > 10 ? 'in-stock' : product.quantityOnHand > 0 ? 'low-stock' : 'out-of-stock'}`}>
                        {product.quantityOnHand || 0}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(product.isPublished)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleTogglePublishStatus(product._id, product.isPublished)}
                          disabled={actionLoading[product._id]}
                          className={`btn btn-sm ${product.isPublished ? 'btn-warning' : 'btn-success'}`}
                          title={product.isPublished ? 'Unpublish Product' : 'Publish Product'}
                        >
                          {actionLoading[product._id] ? (
                            <FaSpinner className="fa-spin" />
                          ) : product.isPublished ? (
                            <><FaEyeSlash /> Unpublish</>
                          ) : (
                            <><FaEye /> Publish</>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(product._id, product.name)}
                          disabled={actionLoading[product._id]}
                          className="btn btn-sm btn-danger"
                          title="Delete Product"
                        >
                          {actionLoading[product._id] ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <><FaTrash /> Delete</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
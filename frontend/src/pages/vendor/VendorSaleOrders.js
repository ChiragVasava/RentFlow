import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaShoppingCart, 
  FaEye, 
  FaPlus,
  FaFilter,
  FaSearch,
  FaCreditCard,
  FaTruck,
  FaCheck,
  FaTimes,
  FaEdit,
  FaSync
} from 'react-icons/fa';
import { saleOrdersAPI } from '../../utils/api';
import '../../pages/SaleOrders.css';
import './VendorSaleOrders.css';

const VendorSaleOrders = () => {
  const navigate = useNavigate();
  const [saleOrders, setSaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    fetchSaleOrders();
    
    // Set up auto-refresh every 30 seconds to catch new auto-generated orders
    const interval = setInterval(() => {
      fetchSaleOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter, paymentFilter]);

  const fetchSaleOrders = async () => {
    try {
      console.log('Fetching sale orders...');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;

      const response = await saleOrdersAPI.getAll(params);
      console.log('Sale orders response:', response.data);
      setSaleOrders(response.data.saleOrders || []);
    } catch (error) {
      console.error('Error fetching sale orders:', error);
      toast.error('Failed to fetch sale orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchSaleOrders();
  };

  const filteredSaleOrders = saleOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer?.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.customer?.companyName && order.customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { icon: <FaEdit />, class: 'draft', label: 'Draft' },
      confirmed: { icon: <FaCheck />, class: 'confirmed', label: 'Confirmed' },
      processing: { icon: <FaCreditCard />, class: 'processing', label: 'Processing' },
      shipped: { icon: <FaTruck />, class: 'shipped', label: 'Shipped' },
      delivered: { icon: <FaCheck />, class: 'delivered', label: 'Delivered' },
      cancelled: { icon: <FaTimes />, class: 'cancelled', label: 'Cancelled' },
      refunded: { icon: <FaTimes />, class: 'refunded', label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`status-badge status-${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { class: 'pending', label: 'Pending' },
      partial: { class: 'partial', label: 'Partial' },
      paid: { class: 'paid', label: 'Paid' },
      refunded: { class: 'refunded', label: 'Refunded' },
      failed: { class: 'failed', label: 'Failed' }
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;
    return (
      <span className={`payment-badge payment-${config.class}`}>
        {config.label}
      </span>
    );
  };

  const handleViewOrder = (orderId) => {
    navigate(`/sale-orders/${orderId}`);
  };

  const handleCreateOrder = () => {
    navigate('/vendor/sale-orders/create');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading sale orders...</p>
      </div>
    );
  }

  return (
    <div className="sale-orders-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaShoppingCart /> My Sale Orders
          </h1>
          <p className="page-subtitle">Manage and track all your customer sale orders</p>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            <FaSync spin={loading} /> Refresh
          </button>
          <button onClick={handleCreateOrder} className="primary-btn">
            <FaPlus /> Create Sale Order
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="sale-orders-list">
        {filteredSaleOrders.length === 0 ? (
          <div className="empty-state">
            <FaShoppingCart className="empty-icon" />
            <h3>No Sale Orders Found</h3>
            <p>
              {searchTerm || statusFilter || paymentFilter
                ? 'No sale orders match your current filters.'
                : 'You haven\'t created any sale orders yet. Click "Create Sale Order" to get started.'}
            </p>
            <button onClick={handleCreateOrder} className="primary-btn">
              <FaPlus /> Create Your First Sale Order
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredSaleOrders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="order-number">{order.orderNumber}</h3>
                    <p className="order-date">
                      Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-badges">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>

                <div className="order-details">
                  <div className="party-info">
                    <strong>Customer:</strong> {order.customer?.name || order.customer?.companyName || 'N/A'}
                  </div>

                  <div className="order-items">
                    <strong>Items:</strong> {order.items?.length || 0} item(s)
                  </div>

                  <div className="order-amount">
                    <strong>Total: ₹{order.totalAmount?.toLocaleString() || '0'}</strong>
                  </div>

                  {order.expectedDeliveryDate && (
                    <div className="delivery-date">
                      <strong>Expected Delivery:</strong> {' '}
                      {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  <button
                    onClick={() => handleViewOrder(order._id)}
                    className="action-btn view-btn"
                    title="View Details"
                  >
                    <FaEye /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorSaleOrders;

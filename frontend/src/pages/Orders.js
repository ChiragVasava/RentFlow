import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FaShoppingBag, FaClock, FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';
import './Orders.css';

const Orders = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await quotationsAPI.getAll();
      setQuotations(response.data.quotations || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FaCheckCircle className="status-icon success" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon danger" />;
      default:
        return <FaClock className="status-icon warning" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    if (filter === 'all') return true;
    return quotation.status === filter;
  });

  const getPrimaryImage = (product) => {
    if (!product) return 'https://via.placeholder.com/80x80?text=No+Image';
    
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.images[0];
    }
    return 'https://via.placeholder.com/80x80?text=No+Image';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FaShoppingBag /> My Orders
        </h1>
        <p className="page-subtitle">View and track your rental orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="order-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Orders ({quotations.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({quotations.filter(q => q.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed ({quotations.filter(q => q.status === 'confirmed').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({quotations.filter(q => q.status === 'cancelled').length})
        </button>
      </div>

      {/* Orders List */}
      {filteredQuotations.length === 0 ? (
        <div className="empty-state card">
          <FaShoppingBag className="empty-icon" />
          <h3>No Orders Found</h3>
          <p>You haven't placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {filteredQuotations.map((quotation) => (
            <div key={quotation._id} className="order-card card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{quotation.quotationNumber}</h3>
                  <p className="order-date">
                    Placed on {new Date(quotation.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className={`order-status ${getStatusClass(quotation.status)}`}>
                  {getStatusIcon(quotation.status)}
                  <span>{quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}</span>
                </div>
              </div>

              <div className="order-items">
                {quotation.items && quotation.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img 
                      src={getPrimaryImage(item.product)} 
                      alt={item.product?.name || 'Product'} 
                      className="item-image"
                    />
                    <div className="item-details">
                      <h4>{item.product?.name || 'Product'}</h4>
                      <p className="item-meta">
                        Quantity: {item.quantity} | 
                        Duration: {new Date(item.rentalStartDate).toLocaleDateString()} - {new Date(item.rentalEndDate).toLocaleDateString()}
                      </p>
                      <p className="item-price">₹{(item.totalPrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span className="total-label">Total Amount:</span>
                  <span className="total-amount">₹{(quotation.totalAmount || 0).toLocaleString()}</span>
                </div>
                <Link 
                  to={`/quotations/${quotation._id}`} 
                  className="btn btn-outline btn-sm"
                >
                  <FaEye /> View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, invoicesAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { 
  FaArrowLeft, FaFileInvoice, FaCalendarAlt, FaMapMarkerAlt, FaCreditCard, 
  FaCheckCircle, FaBox, FaDownload, FaTruck, FaEdit, FaTimes,
  FaClock, FaUser, FaBuilding, FaInfoCircle, FaReceipt
} from 'react-icons/fa';
import './QuotationDetails.css'; // Reuse same styles

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOne(id);
      console.log('Order response:', response.data);
      setOrder(response.data.order || response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus}?`)) return;

    try {
      setActionLoading(true);
      await ordersAPI.updateStatus(id, { status: newStatus });
      toast.success('Order status updated successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async (newPaymentStatus) => {
    if (!window.confirm(`Update payment status to ${newPaymentStatus}?`)) return;

    try {
      setActionLoading(true);
      await ordersAPI.updatePayment(id, { paymentStatus: newPaymentStatus });
      toast.success('Payment status updated successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setActionLoading(true);
      await ordersAPI.cancel(id);
      toast.success('Order cancelled successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!window.confirm('Create invoice for this order?')) return;

    try {
      setActionLoading(true);
      const response = await invoicesAPI.create({
        orderId: id,
        paymentType: 'full',
        initialPayment: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Invoice generated from order'
      });
      
      if (response.data.success) {
        toast.success('Invoice created successfully');
        navigate(`/invoices/${response.data.invoice._id}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { icon: <FaEdit />, class: 'draft', label: 'Draft' },
      confirmed: { icon: <FaCheckCircle />, class: 'approved', label: 'Confirmed' },
      processing: { icon: <FaClock />, class: 'pending', label: 'Processing' },
      picked_up: { icon: <FaTruck />, class: 'pending', label: 'Picked Up' },
      active: { icon: <FaBox />, class: 'approved', label: 'Active' },
      completed: { icon: <FaCheckCircle />, class: 'approved', label: 'Completed' },
      cancelled: { icon: <FaTimes />, class: 'rejected', label: 'Cancelled' }
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
      partial: { class: 'pending', label: 'Partial' },
      paid: { class: 'approved', label: 'Paid' }
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;
    return (
      <span className={`status-badge status-${config.class}`}>
        <FaCreditCard /> {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <div className="empty-state card">
          <FaFileInvoice className="empty-icon" />
          <h3>Order not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/orders')}>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const canUpdateStatus = user?.role === 'vendor' || user?.role === 'admin';
  const canUpdatePayment = user?.role === 'vendor' || user?.role === 'admin';
  const canCancel = (user?.role === 'customer' || user?.role === 'admin') && 
                     order.status !== 'cancelled' && order.status !== 'completed';

  return (
    <div className="page-container quotation-details-page">
      {/* Header */}
      <div className="details-header">
        <button className="btn btn-text" onClick={() => navigate('/orders')}>
          <FaArrowLeft /> Back to Orders
        </button>
        
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => toast.info('Download feature coming soon')}>
            <FaDownload /> Download PDF
          </button>
          {user?.role === 'vendor' && order.status !== 'cancelled' && (
            <button className="btn btn-primary" onClick={handleCreateInvoice} disabled={actionLoading}>
              <FaReceipt /> Create Invoice
            </button>
          )}
        </div>
      </div>

      {/* Order Info Card */}
      <div className="card details-card">
        <div className="card-header">
          <div>
            <h1 className="quotation-title">
              <FaFileInvoice /> Order #{order.orderNumber}
            </h1>
            <div className="quotation-meta">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-section">
            <h3><FaCalendarAlt /> Order Date</h3>
            <p>{new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          {order.quotation && (
            <div className="info-section">
              <h3><FaFileInvoice /> Quotation Reference</h3>
              <p>
                <button 
                  className="btn btn-link"
                  onClick={() => navigate(`/quotations/${order.quotation}`)}
                >
                  View Original Quotation
                </button>
              </p>
            </div>
          )}

          {order.customer && (
            <div className="info-section">
              <h3><FaUser /> Customer</h3>
              <p><strong>{order.customer.name || order.customer.companyName}</strong></p>
              {order.customer.email && <p>{order.customer.email}</p>}
              {order.customer.phone && <p>{order.customer.phone}</p>}
            </div>
          )}

          {order.vendor && (
            <div className="info-section">
              <h3><FaBuilding /> Vendor</h3>
              <p><strong>{order.vendor.name || order.vendor.companyName}</strong></p>
            </div>
          )}

          {order.shippingAddress && (
            <div className="info-section full-width">
              <h3><FaMapMarkerAlt /> Shipping Address</h3>
              <p>
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                {order.shippingAddress.country || 'India'}
              </p>
            </div>
          )}

          {order.notes && (
            <div className="info-section full-width">
              <h3><FaInfoCircle /> Notes</h3>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="card">
        <div className="card-header">
          <h2><FaBox /> Order Items</h2>
        </div>
        <div className="items-table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Rental Period</th>
                <th>Price/Unit</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="product-info">
                      {item.product?.images?.[0] && (
                        <img 
                          src={item.product.images[0].url} 
                          alt={item.product.name}
                          className="product-thumb"
                        />
                      )}
                      <div>
                        <strong>{item.product?.name || 'Product'}</strong>
                        {item.product?.category && (
                          <div className="product-category">{item.product.category}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.rentalStartDate && item.rentalEndDate ? (
                      <>
                        {new Date(item.rentalStartDate).toLocaleDateString()}<br />
                        to {new Date(item.rentalEndDate).toLocaleDateString()}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>₹{item.pricePerUnit?.toLocaleString()}</td>
                  <td><strong>₹{item.totalPrice?.toLocaleString()}</strong></td>
                  <td>{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="pricing-summary">
          <div className="price-row">
            <span>Subtotal:</span>
            <span>₹{order.subtotal?.toLocaleString()}</span>
          </div>
          <div className="price-row">
            <span>Tax ({order.taxRate || 18}%):</span>
            <span>₹{order.taxAmount?.toLocaleString()}</span>
          </div>
          {order.securityDeposit > 0 && (
            <div className="price-row">
              <span>Security Deposit:</span>
              <span>₹{order.securityDeposit?.toLocaleString()}</span>
            </div>
          )}
          <div className="price-row total">
            <span>Total Amount:</span>
            <span>₹{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="details-actions">
        {canUpdatePayment && order.paymentStatus === 'pending' && (
          <button 
            className="btn btn-success" 
            onClick={() => handleUpdatePayment('paid')} 
            disabled={actionLoading}
          >
            <FaCheckCircle /> Mark as Paid
          </button>
        )}

        {canUpdateStatus && order.status === 'confirmed' && (
          <button 
            className="btn btn-primary" 
            onClick={() => handleUpdateStatus('processing')} 
            disabled={actionLoading}
          >
            <FaClock /> Start Processing
          </button>
        )}

        {canUpdateStatus && order.status === 'processing' && (
          <button 
            className="btn btn-primary" 
            onClick={() => handleUpdateStatus('picked_up')} 
            disabled={actionLoading}
          >
            <FaTruck /> Mark as Picked Up
          </button>
        )}

        {canUpdateStatus && order.status === 'picked_up' && (
          <button 
            className="btn btn-primary" 
            onClick={() => handleUpdateStatus('active')} 
            disabled={actionLoading}
          >
            <FaBox /> Mark as Active
          </button>
        )}

        {canUpdateStatus && order.status === 'active' && (
          <button 
            className="btn btn-success" 
            onClick={() => handleUpdateStatus('completed')} 
            disabled={actionLoading}
          >
            <FaCheckCircle /> Mark as Completed
          </button>
        )}

        {canCancel && (
          <button 
            className="btn btn-danger" 
            onClick={handleCancelOrder} 
            disabled={actionLoading}
          >
            <FaTimes /> Cancel Order
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;

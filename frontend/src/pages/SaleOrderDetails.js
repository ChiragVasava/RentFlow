import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaShoppingCart, 
  FaArrowLeft,
  FaUser,
  FaBuilding,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaCalendarAlt,
  FaStickyNote,
  FaBox,
  FaEdit,
  FaCheck,
  FaTimes,
  FaMoneyBillWave,
  FaReceipt
} from 'react-icons/fa';
import { saleOrdersAPI, invoicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './SaleOrderDetails.css';

const SaleOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saleOrder, setSaleOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchSaleOrderDetails();
  }, [id]);

  const fetchSaleOrderDetails = async () => {
    try {
      const response = await saleOrdersAPI.getOne(id);
      setSaleOrder(response.data.saleOrder);
    } catch (error) {
      console.error('Error fetching sale order:', error);
      toast.error('Failed to fetch sale order details');
      navigate('/sale-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setActionLoading(true);
      await saleOrdersAPI.updateStatus(id, { status: newStatus, notes });
      toast.success('Status updated successfully');
      setShowUpdateStatusModal(false);
      fetchSaleOrderDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!newPaymentStatus) {
      toast.error('Please select a payment status');
      return;
    }

    try {
      setActionLoading(true);
      await saleOrdersAPI.updatePayment(id, { 
        paymentStatus: newPaymentStatus, 
        paymentMethod: newPaymentMethod,
        notes 
      });
      toast.success('Payment status updated successfully');
      setShowUpdatePaymentModal(false);
      fetchSaleOrderDetails();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      setActionLoading(true);
      await saleOrdersAPI.cancel(id, { reason: cancelReason });
      toast.success('Sale order cancelled successfully');
      setShowCancelModal(false);
      fetchSaleOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!window.confirm('Create invoice for this sale order?')) return;

    try {
      setActionLoading(true);
      const response = await invoicesAPI.create({
        orderId: id,
        paymentType: 'full',
        initialPayment: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Invoice generated from sale order'
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading sale order details...</p>
      </div>
    );
  }

  if (!saleOrder) {
    return (
      <div className="error-container">
        <h2>Sale Order Not Found</h2>
        <button onClick={() => navigate('/sale-orders')} className="back-btn">
          <FaArrowLeft /> Back to Sale Orders
        </button>
      </div>
    );
  }

  return (
    <div className="sale-order-details-container">
      {/* Header */}
      <div className="details-header">
        <button onClick={() => navigate('/sale-orders')} className="back-btn">
          <FaArrowLeft /> Back to Sale Orders
        </button>
        {user?.role === 'vendor' && saleOrder.status !== 'cancelled' && (
          <button 
            onClick={handleCreateInvoice} 
            className="action-btn btn-primary"
            disabled={actionLoading}
          >
            <FaReceipt /> Create Invoice
          </button>
        )}
      </div>

      {/* Sale Order Info Card */}
      <div className="card order-info-card">
        <div className="order-title-section">
          <div>
            <h1 className="order-title">
              <FaShoppingCart /> {saleOrder.orderNumber}
            </h1>
            <p className="order-date">
              Created on {new Date(saleOrder.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="status-badges">
            {getStatusBadge(saleOrder.status)}
            {getPaymentStatusBadge(saleOrder.paymentStatus)}
          </div>
        </div>

        {/* Party Information */}
        <div className="party-info">
          {user?.role === 'vendor' && saleOrder.customer && (
            <div className="party-card">
              <FaUser />
              <div>
                <div className="party-label">Customer</div>
                <div className="party-name">{saleOrder.customer.name || saleOrder.customer.companyName}</div>
                <div className="party-email">{saleOrder.customer.email}</div>
              </div>
            </div>
          )}
          {user?.role === 'customer' && saleOrder.vendor && (
            <div className="party-card">
              <FaBuilding />
              <div>
                <div className="party-label">Vendor</div>
                <div className="party-name">{saleOrder.vendor.name || saleOrder.vendor.companyName}</div>
                <div className="party-email">{saleOrder.vendor.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection/Cancellation Notice */}
      {saleOrder.status === 'cancelled' && saleOrder.rejectionReason && (
        <div className="card rejection-card">
          <h3><FaTimes /> Order Cancelled</h3>
          <p className="rejection-reason">{saleOrder.rejectionReason}</p>
        </div>
      )}

      {/* Notes */}
      {saleOrder.vendorNotes && (
        <div className="card vendor-notes-card">
          <h3><FaStickyNote /> Vendor Notes</h3>
          <p>{saleOrder.vendorNotes}</p>
        </div>
      )}

      {saleOrder.customerNotes && (
        <div className="card vendor-notes-card">
          <h3><FaStickyNote /> Customer Notes</h3>
          <p>{saleOrder.customerNotes}</p>
        </div>
      )}

      <div className="details-grid">
        {/* Items Section */}
        <div className="card items-section">
          <h2 className="section-title">
            <FaBox /> Order Items
          </h2>
          
          <div className="items-list">
            {saleOrder.items && saleOrder.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-details">
                  <div className="detail-row">
                    <span className="detail-label">Product:</span>
                    <span className="detail-value">{item.product?.name || 'Product'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">{item.quantity}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Price/Unit:</span>
                    <span className="detail-value">₹{(item.pricePerUnit || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="detail-row total-row">
                    <span className="detail-label">Total:</span>
                    <span className="detail-value total-value">₹{(item.totalPrice || 0).toLocaleString()}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{getStatusBadge(item.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{(saleOrder.subtotal || 0).toLocaleString()}</span>
            </div>
            {saleOrder.shippingAmount > 0 && (
              <div className="summary-row">
                <span>Shipping:</span>
                <span>₹{(saleOrder.shippingAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Tax ({saleOrder.taxRate || 18}%):</span>
              <span>₹{(saleOrder.taxAmount || 0).toLocaleString()}</span>
            </div>
            {saleOrder.discountAmount > 0 && (
              <div className="summary-row">
                <span>Discount:</span>
                <span>-₹{(saleOrder.discountAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row total-row">
              <span>Total Amount:</span>
              <span>₹{(saleOrder.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="sidebar-info">
          {/* Shipping Address */}
          {saleOrder.shippingAddress && (
            <div className="card info-card">
              <h3 className="info-card-title">
                <FaMapMarkerAlt /> Shipping Address
              </h3>
              <div className="info-content">
                <p><strong>{saleOrder.shippingAddress.name}</strong></p>
                <p>{saleOrder.shippingAddress.street}</p>
                <p>{saleOrder.shippingAddress.city}, {saleOrder.shippingAddress.state} {saleOrder.shippingAddress.zipCode}</p>
                <p className="info-contact">{saleOrder.shippingAddress.phone}</p>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="card info-card">
            <h3 className="info-card-title">
              <FaCreditCard /> Payment Information
            </h3>
            <div className="info-content">
              <p><strong>Method:</strong> {saleOrder.paymentMethod?.toUpperCase()}</p>
              <p><strong>Status:</strong> {getPaymentStatusBadge(saleOrder.paymentStatus)}</p>
            </div>
          </div>

          {/* Delivery Information */}
          {saleOrder.expectedDeliveryDate && (
            <div className="card info-card">
              <h3 className="info-card-title">
                <FaTruck /> Delivery Information
              </h3>
              <div className="info-content">
                <p><strong>Expected:</strong> {new Date(saleOrder.expectedDeliveryDate).toLocaleDateString()}</p>
                {saleOrder.actualDeliveryDate && (
                  <p><strong>Delivered:</strong> {new Date(saleOrder.actualDeliveryDate).toLocaleDateString()}</p>
                )}
                {saleOrder.trackingNumber && (
                  <p><strong>Tracking:</strong> {saleOrder.trackingNumber}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {user?.role === 'vendor' && (
            <div className="card actions-card">
              <h3 className="info-card-title">Actions</h3>
              <div className="action-buttons">
                <button
                  onClick={() => setShowUpdateStatusModal(true)}
                  className="action-btn primary"
                  disabled={saleOrder.status === 'cancelled' || saleOrder.status === 'delivered'}
                >
                  <FaEdit /> Update Status
                </button>

                <button
                  onClick={() => setShowUpdatePaymentModal(true)}
                  className="action-btn secondary"
                  disabled={saleOrder.paymentStatus === 'paid' || saleOrder.status === 'cancelled'}
                >
                  <FaMoneyBillWave /> Update Payment
                </button>

                {(saleOrder.status === 'draft' || saleOrder.status === 'confirmed' || saleOrder.status === 'processing') && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="action-btn danger"
                  >
                    <FaTimes /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUpdateStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Order Status</h3>
            <div className="form-group">
              <label>New Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="action-btn primary"
              >
                {actionLoading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setShowUpdateStatusModal(false)}
                className="action-btn secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdatePaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Payment Status</h3>
            <div className="form-group">
              <label>Payment Status:</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Method:</label>
              <select
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={handleUpdatePayment}
                disabled={actionLoading}
                className="action-btn primary"
              >
                {actionLoading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setShowUpdatePaymentModal(false)}
                className="action-btn secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cancel Order</h3>
            <div className="form-group">
              <label>Cancellation Reason:</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows="4"
                required
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="action-btn danger"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="action-btn secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleOrderDetails;
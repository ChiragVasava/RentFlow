import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { 
  FaArrowLeft, FaFileInvoice, FaCalendarAlt, FaMapMarkerAlt, FaCreditCard, 
  FaCheckCircle, FaBox, FaDownload, FaPaperPlane, FaEdit, FaTrash,
  FaTimesCircle, FaExchangeAlt, FaClock, FaUser, FaBuilding, FaInfoCircle
} from 'react-icons/fa';
import './QuotationDetails.css';

const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [vendorNotes, setVendorNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [counterOfferItems, setCounterOfferItems] = useState([]);

  useEffect(() => {
    fetchQuotationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (quotation?.items) {
      setCounterOfferItems(quotation.items.map(item => ({
        id: item._id,
        productId: item.product?._id,
        productName: item.product?.name,
        originalPrice: item.pricePerUnit,
        adjustedPrice: item.pricePerUnit,
        quantity: item.quantity
      })));
    }
  }, [quotation]);

  const fetchQuotationDetails = async () => {
    try {
      setLoading(true);
      const response = await quotationsAPI.getOne(id);
      setQuotation(response.data.quotation || response.data);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to fetch quotation details');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit this quotation for vendor review?')) return;

    try {
      setActionLoading(true);
      await quotationsAPI.submit(id);
      toast.success('Quotation submitted for vendor review');
      fetchQuotationDetails();
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounterOffer = () => {
    setShowCounterOfferModal(true);
  };

  const handleCounterOfferSubmit = async () => {
    const hasChanges = counterOfferItems.some(item => item.adjustedPrice !== item.originalPrice);
    
    if (!hasChanges) {
      toast.info('No price changes to submit');
      setShowCounterOfferModal(false);
      return;
    }

    try {
      setActionLoading(true);
      const items = counterOfferItems.map(item => ({
        productId: item.productId,
        adjustedPrice: item.adjustedPrice
      }));
      
      await quotationsAPI.counterOffer(id, {
        items,
        notes: vendorNotes
      });
      
      toast.success('Counter offer submitted successfully');
      setShowCounterOfferModal(false);
      setVendorNotes('');
      fetchQuotationDetails();
    } catch (error) {
      console.error('Error submitting counter offer:', error);
      toast.error(error.response?.data?.message || 'Failed to submit counter offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      
      // For vendors, send vendor notes
      const data = user?.role === 'vendor' ? {
        vendorNotes
      } : {};
      
      await quotationsAPI.approve(id, data);
      toast.success('Quotation approved successfully');
      setShowApproveModal(false);
      fetchQuotationDetails();
    } catch (error) {
      console.error('Error approving quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await quotationsAPI.reject(id, { rejectionReason });
      toast.success('Quotation rejected');
      setShowRejectModal(false);
      fetchQuotationDetails();
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to reject quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    try {
      const confirmed = window.confirm('Convert this quotation to an order? This will create a rental order and reserve inventory.');
      if (!confirmed) return;

      setActionLoading(true);
      
      const response = await quotationsAPI.convertToOrder(id);
      
      toast.success('Order created successfully!');
      
      // Navigate immediately to orders page  
      navigate(`/orders/${response.data.order._id}`);
      
    } catch (error) {
      console.error('Convert error:', error);
      toast.error(error.response?.data?.message || 'Failed to convert quotation');
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;

    try {
      setActionLoading(true);
      await quotationsAPI.delete(id);
      toast.success('Quotation deleted successfully');
      navigate('/quotations');
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to delete quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { icon: <FaEdit />, class: 'draft', label: 'Draft' },
      pending: { icon: <FaClock />, class: 'pending', label: 'Pending Review' },
      approved: { icon: <FaCheckCircle />, class: 'approved', label: 'Approved' },
      rejected: { icon: <FaTimesCircle />, class: 'rejected', label: 'Rejected' },
      converted: { icon: <FaExchangeAlt />, class: 'converted', label: 'Converted to Order' },
      expired: { icon: <FaClock />, class: 'expired', label: 'Expired' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`status-badge status-${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading quotation details...</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="page-container">
        <div className="empty-state card">
          <FaFileInvoice className="empty-icon" />
          <h3>Quotation not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/quotations')}>
            Back to Quotations
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'customer' && quotation.status === 'draft';
  const canDelete = user?.role === 'customer' && quotation.status === 'draft';
  const canSubmit = user?.role === 'customer' && quotation.status === 'draft';
  const canApprove = (user?.role === 'vendor' || user?.role === 'admin') && quotation.status === 'pending';
  const canReject = (user?.role === 'vendor' || user?.role === 'admin') && quotation.status === 'pending';
  const canConvert = user?.role === 'customer' && quotation.status === 'approved' && !quotation.convertedToOrder;
  const canCounterOffer = (
    (user?.role === 'vendor' && quotation.status === 'pending') ||
    (user?.role === 'customer' && quotation.status === 'pending' && quotation.counterOffers && quotation.counterOffers.length > 0)
  );

  return (
    <div className="page-container quotation-details-page">
      {/* Header */}
      <div className="details-header">
        <button className="btn btn-text" onClick={() => navigate('/quotations')}>
          <FaArrowLeft /> Back to Quotations
        </button>
        
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => toast.info('Download feature coming soon')}>
            <FaDownload /> Download PDF
          </button>
        </div>
      </div>

      {/* Quotation Info Card */}
      <div className="card quotation-info-card">
        <div className="quotation-title-section">
          <div>
            <h1 className="quotation-title">
              <FaFileInvoice /> {quotation.quotationNumber}
            </h1>
            <p className="quotation-date">
              Created on {new Date(quotation.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          {getStatusBadge(quotation.status)}
        </div>

        {quotation.validUntil && (
          <div className="validity-info">
            <FaCalendarAlt />
            <span>Valid until: {new Date(quotation.validUntil).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        )}

        {/* Party Information */}
        <div className="party-info">
          {user?.role === 'vendor' && quotation.customer && (
            <div className="party-card">
              <FaUser />
              <div>
                <div className="party-label">Customer</div>
                <div className="party-name">{quotation.customer.name || quotation.customer.companyName}</div>
                <div className="party-email">{quotation.customer.email}</div>
              </div>
            </div>
          )}
          {user?.role === 'customer' && quotation.vendor && (
            <div className="party-card">
              <FaBuilding />
              <div>
                <div className="party-label">Vendor</div>
                <div className="party-name">{quotation.vendor.name || quotation.vendor.companyName || 'Vendor'}</div>
                <div className="party-email">{quotation.vendor.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Notice */}
      {quotation.status === 'rejected' && quotation.rejectionReason && (
        <div className="card rejection-card">
          <h3><FaTimesCircle /> Quotation Rejected</h3>
          <p className="rejection-reason">{quotation.rejectionReason}</p>
        </div>
      )}

      {/* Vendor Notes */}
      {quotation.vendorNotes && (
        <div className="card vendor-notes-card">
          <h3><FaInfoCircle /> Vendor Notes</h3>
          <p>{quotation.vendorNotes}</p>
        </div>
      )}

      {/* Counter Offer History */}
      {quotation.counterOffers && quotation.counterOffers.length > 0 && (
        <div className="card">
          <h3 className="section-title">
            <FaExchangeAlt /> Counter Offer History
          </h3>
          <div className="counter-offer-history">
            {quotation.counterOffers.map((offer, index) => (
              <div key={index} className="counter-offer-item">
                <div className="counter-offer-header">
                  <div>
                    <strong>{offer.offeredByRole === 'vendor' ? 'Vendor' : 'Customer'} Counter Offer #{index + 1}</strong>
                    <span className="counter-offer-date">
                      {new Date(offer.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="counter-offer-amount">₹{offer.totalAmount.toLocaleString()}</div>
                </div>
                {offer.notes && (
                  <div className="counter-offer-notes">
                    <strong>Notes:</strong> {offer.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="details-grid">
        {/* Items Section */}
        <div className="card items-section">
          <h2 className="section-title">
            <FaBox /> Quotation Items
          </h2>
          
          <div className="items-list">
            {quotation.items && quotation.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-details">
                  <div className="detail-row">
                    <span className="detail-label">Product:</span>
                    <span className="detail-value">{item.product?.name || 'Product'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Start Date:</span>
                    <span className="detail-value">
                      {item.rentalStartDate ? new Date(item.rentalStartDate).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      }) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">
                      {item.rentalEndDate ? new Date(item.rentalEndDate).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      }) : 'N/A'}
                    </span>
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
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{(quotation.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Tax ({quotation.taxRate}%):</span>
              <span>₹{(quotation.taxAmount || 0).toLocaleString()}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total Amount:</span>
              <span>₹{(quotation.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="sidebar-info">
          {/* Shipping Address */}
          {quotation.shippingAddress && (
            <div className="card info-card">
              <h3 className="info-card-title">
                <FaMapMarkerAlt /> Shipping Address
              </h3>
              <div className="info-content">
                <p><strong>{quotation.shippingAddress.name}</strong></p>
                <p>{quotation.shippingAddress.street}</p>
                <p>{quotation.shippingAddress.city}, {quotation.shippingAddress.state} {quotation.shippingAddress.zipCode}</p>
                <p className="info-contact">{quotation.shippingAddress.phone}</p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          {quotation.paymentMethod && (
            <div className="card info-card">
              <h3 className="info-card-title">
                <FaCreditCard /> Payment Method
              </h3>
              <div className="info-content">
                <p className="payment-method">{quotation.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
          )}

          {quotation.notes && (
            <div className="card info-card">
              <h3 className="info-card-title">Notes</h3>
              <div className="info-content">
                <p>{quotation.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card action-buttons">
        {canSubmit && (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={actionLoading}>
            <FaPaperPlane /> Submit for Review
          </button>
        )}
        {canEdit && (
          <button className="btn btn-secondary" onClick={() => navigate(`/quotations/${id}/edit`)}>
            <FaEdit /> Edit Quotation
          </button>
        )}
        {canDelete && (
          <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
            <FaTrash /> Delete Quotation
          </button>
        )}
        
        {/* Vendor Actions */}
        {canApprove && (
          <>
            <button className="btn btn-secondary" onClick={handleCounterOffer} disabled={actionLoading}>
              <FaEdit /> Counter Offer
            </button>
            <button className="btn btn-success" onClick={() => setShowApproveModal(true)} disabled={actionLoading}>
              <FaCheckCircle /> Approve As-Is
            </button>
          </>
        )}
        
        {/* Customer Counter Offer */}
        {canCounterOffer && user?.role === 'customer' && (
          <button className="btn btn-secondary" onClick={handleCounterOffer} disabled={actionLoading}>
            <FaEdit /> Make Counter Offer
          </button>
        )}
        
        {/* Customer Accept */}
        {user?.role === 'customer' && quotation.status === 'pending' && quotation.counterOffers && quotation.counterOffers.length > 0 && (
          <button className="btn btn-success" onClick={() => setShowApproveModal(true)} disabled={actionLoading}>
            <FaCheckCircle /> Accept Offer
          </button>
        )}
        
        {canReject && (
          <button className="btn btn-danger" onClick={() => setShowRejectModal(true)} disabled={actionLoading}>
            <FaTimesCircle /> Reject Quotation
          </button>
        )}
        {canConvert && (
          <button 
            className="btn btn-primary btn-large" 
            onClick={handleConvertToOrder}
            disabled={actionLoading}
          >
            <FaExchangeAlt /> Convert to Order
          </button>
        )}
        
        {/* Debug Info - Remove after testing */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.85rem' }}>
            <h4>Debug Info:</h4>
            <p>User Role: {user?.role}</p>
            <p>Quotation Status: {quotation?.status}</p>
            <p>Converted to Order: {quotation?.convertedToOrder ? 'Yes' : 'No'}</p>
            <p>Can Convert: {canConvert ? 'Yes' : 'No'}</p>
            {!canConvert && (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                Button hidden because: {
                  user?.role !== 'customer' ? 'Not a customer' :
                  quotation?.status !== 'approved' ? `Status is "${quotation?.status}" (needs "approved")` :
                  quotation?.convertedToOrder ? 'Already converted to order' :
                  'Unknown reason'
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2><FaCheckCircle /> Approve Quotation</h2>
            <div className="modal-content">
              <div className="form-group">
                <label>Vendor Notes (Optional)</label>
                <textarea
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="Add any notes for the customer..."
                  rows="4"
                />
              </div>
              <p className="modal-info">Approving this quotation will allow the customer to convert it to an order.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>
                <FaCheckCircle /> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2><FaTimesCircle /> Reject Quotation</h2>
            <div className="modal-content">
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows="4"
                  required
                />
              </div>
              <p className="modal-info">The customer will be notified with this rejection reason.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
                <FaTimesCircle /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {showCounterOfferModal && (
        <div className="modal-overlay" onClick={() => setShowCounterOfferModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2><FaEdit /> Counter Offer - Adjust Pricing</h2>
            <div className="modal-content">
              <p className="modal-info">Adjust the pricing for items below. Changes will be included in the approval.</p>
              <div className="counter-offer-items">
                {counterOfferItems.map((item, index) => (
                  <div key={item.id || index} className="counter-offer-item">
                    <div className="item-info">
                      <strong>{item.productName}</strong>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className="price-adjustment">
                      <div className="price-field">
                        <label>Original Price/Unit</label>
                        <input
                          type="number"
                          value={item.originalPrice}
                          disabled
                          className="form-control"
                        />
                      </div>
                      <div className="price-field">
                        <label>Adjusted Price/Unit</label>
                        <input
                          type="number"
                          value={item.adjustedPrice}
                          onChange={(e) => {
                            const newItems = [...counterOfferItems];
                            newItems[index].adjustedPrice = parseFloat(e.target.value) || 0;
                            setCounterOfferItems(newItems);
                          }}
                          className="form-control"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {item.adjustedPrice !== item.originalPrice && (
                        <div className="price-change">
                          {item.adjustedPrice > item.originalPrice ? (
                            <span className="increase">+₹{(item.adjustedPrice - item.originalPrice).toFixed(2)}</span>
                          ) : (
                            <span className="decrease">-₹{(item.originalPrice - item.adjustedPrice).toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCounterOfferModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCounterOfferSubmit}>
                <FaCheckCircle /> Apply & Continue to Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationDetails;

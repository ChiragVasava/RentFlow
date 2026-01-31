import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaFileInvoice, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaCheckCircle,
  FaBox,
  FaDownload
} from 'react-icons/fa';
import './QuotationDetails.css';

const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotationDetails();
  }, [id]);

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

  const getStatusConfig = (status) => {
    const configs = {
      draft: { class: 'status-draft', text: 'Draft' },
      sent: { class: 'status-sent', text: 'Sent' },
      confirmed: { class: 'status-confirmed', text: 'Confirmed' },
      expired: { class: 'status-expired', text: 'Expired' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };
    return configs[status] || configs.draft;
  };

  const handleDownload = () => {
    toast.info('Download feature coming soon!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading quotation details...</p>
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

  const statusConfig = getStatusConfig(quotation.status);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="details-header">
        <button className="btn btn-text" onClick={() => navigate('/quotations')}>
          <FaArrowLeft /> Back to Quotations
        </button>
        
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleDownload}>
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
          <span className={`status-badge ${statusConfig.class}`}>
            {statusConfig.text}
          </span>
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
      </div>

      <div className="details-grid">
        {/* Items Section */}
        <div className="card items-section">
          <h2 className="section-title">
            <FaBox /> Quotation Items
          </h2>
          
          <div className="items-table">
            <div className="table-header">
              <div>Product</div>
              <div>Rental Period</div>
              <div>Quantity</div>
              <div>Price/Unit</div>
              <div>Total</div>
            </div>
            
            {quotation.items && quotation.items.map((item, index) => (
              <div key={index} className="table-row">
                <div className="product-info">
                  <div className="product-name">
                    {item.product?.name || 'Product'}
                  </div>
                  {item.product?.category && (
                    <div className="product-category">{item.product.category}</div>
                  )}
                </div>
                
                <div className="rental-period">
                  {item.rentalStartDate && item.rentalEndDate ? (
                    <>
                      <div>{new Date(item.rentalStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="period-separator">to</div>
                      <div>{new Date(item.rentalEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </>
                  ) : 'N/A'}
                </div>
                
                <div>{item.quantity}</div>
                <div>₹{(item.pricePerUnit || 0).toLocaleString()}</div>
                <div className="item-total">₹{(item.totalPrice || 0).toLocaleString()}</div>
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

          {/* Status Info */}
          {quotation.status === 'confirmed' && (
            <div className="card info-card success-card">
              <h3 className="info-card-title">
                <FaCheckCircle /> Confirmed
              </h3>
              <div className="info-content">
                <p>This quotation has been confirmed and will be converted to a Sale Order soon.</p>
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
    </div>
  );
};

export default QuotationDetails;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FaFileInvoice, FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt } from 'react-icons/fa';
import './Quotations.css';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationsAPI.getAll();
      setQuotations(response.data.quotations || response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'status-draft', icon: <FaClock />, text: 'Draft' },
      sent: { class: 'status-sent', icon: <FaClock />, text: 'Sent' },
      confirmed: { class: 'status-confirmed', icon: <FaCheckCircle />, text: 'Confirmed' },
      expired: { class: 'status-expired', icon: <FaTimesCircle />, text: 'Expired' },
      cancelled: { class: 'status-cancelled', icon: <FaTimesCircle />, text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const filteredQuotations = quotations.filter(q => 
    selectedStatus === 'all' || q.status === selectedStatus
  );

  const handleViewDetails = (id) => {
    navigate(`/quotations/${id}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading quotations...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaFileInvoice /> My Quotations
          </h1>
          <p className="page-subtitle">View and manage your rental quotations</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab ${selectedStatus === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('all')}
        >
          All ({quotations.length})
        </button>
        <button
          className={`tab ${selectedStatus === 'draft' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('draft')}
        >
          Draft ({quotations.filter(q => q.status === 'draft').length})
        </button>
        <button
          className={`tab ${selectedStatus === 'sent' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('sent')}
        >
          Sent ({quotations.filter(q => q.status === 'sent').length})
        </button>
        <button
          className={`tab ${selectedStatus === 'confirmed' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('confirmed')}
        >
          Confirmed ({quotations.filter(q => q.status === 'confirmed').length})
        </button>
      </div>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <div className="empty-state card">
          <FaFileInvoice className="empty-icon" />
          <h3>No quotations found</h3>
          <p>You don't have any {selectedStatus !== 'all' ? selectedStatus : ''} quotations yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="quotations-grid">
          {filteredQuotations.map((quotation) => (
            <div key={quotation._id} className="quotation-card card">
              <div className="quotation-header">
                <div className="quotation-number">
                  <FaFileInvoice />
                  {quotation.quotationNumber}
                </div>
                {getStatusBadge(quotation.status)}
              </div>

              <div className="quotation-info">
                <div className="info-row">
                  <span className="info-label">
                    <FaCalendarAlt /> Date:
                  </span>
                  <span className="info-value">
                    {new Date(quotation.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Items:</span>
                  <span className="info-value">{quotation.items?.length || 0} product(s)</span>
                </div>

                {quotation.validUntil && (
                  <div className="info-row">
                    <span className="info-label">Valid Until:</span>
                    <span className="info-value">
                      {new Date(quotation.validUntil).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="quotation-amount">
                <div className="amount-row">
                  <span>Subtotal:</span>
                  <span>₹{(quotation.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="amount-row">
                  <span>Tax ({quotation.taxRate}%):</span>
                  <span>₹{(quotation.taxAmount || 0).toLocaleString()}</span>
                </div>
                <div className="amount-row total">
                  <span>Total Amount:</span>
                  <span>₹{(quotation.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="quotation-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => handleViewDetails(quotation._id)}
                >
                  <FaEye /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {quotations.length > 0 && (
        <div className="stats-summary card">
          <h3>Summary</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Quotations</span>
              <span className="stat-value">{quotations.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confirmed</span>
              <span className="stat-value confirmed">
                {quotations.filter(q => q.status === 'confirmed').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending</span>
              <span className="stat-value pending">
                {quotations.filter(q => q.status === 'sent' || q.status === 'draft').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Value</span>
              <span className="stat-value">
                ₹{quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;

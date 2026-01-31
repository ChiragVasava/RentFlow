import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaFileInvoice,
  FaFilter,
  FaSearch,
  FaEye,
  FaClock,
  FaCheck,
  FaTimes,
  FaExchangeAlt
} from 'react-icons/fa';
import { quotationsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './VendorQuotations.css';

const VendorQuotations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const fetchQuotations = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const response = await quotationsAPI.getAll(params);
      setQuotations(response.data.quotations || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotations = quotations.filter(quotation =>
    quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quotation.customer?.name && quotation.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (quotation.customer?.companyName && quotation.customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { icon: <FaClock />, class: 'draft', label: 'Draft' },
      pending: { icon: <FaClock />, class: 'pending', label: 'Pending Review' },
      approved: { icon: <FaCheck />, class: 'approved', label: 'Approved' },
      rejected: { icon: <FaTimes />, class: 'rejected', label: 'Rejected' },
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

  const handleViewQuotation = (quotationId) => {
    navigate(`/quotations/${quotationId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading quotations...</p>
      </div>
    );
  }

  return (
    <div className="vendor-quotations-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaFileInvoice /> Quotation Requests
          </h1>
          <p className="page-subtitle">Manage customer quotation requests</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by quotation number or customer..."
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
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotations List */}
      <div className="quotations-list">
        {filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <FaFileInvoice className="empty-icon" />
            <h3>No Quotations Found</h3>
            <p>
              {searchTerm || statusFilter
                ? 'No quotations match your current filters.'
                : `You haven't received any quotation requests yet.`}
            </p>
          </div>
        ) : (
          <div className="quotations-grid">
            {filteredQuotations.map(quotation => (
              <div key={quotation._id} className="quotation-card">
                <div className="quotation-header">
                  <div className="quotation-info">
                    <h3 className="quotation-number">{quotation.quotationNumber}</h3>
                    <p className="quotation-date">
                      Created: {new Date(quotation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(quotation.status)}
                </div>

                <div className="quotation-details">
                  {quotation.customer && (
                    <div className="customer-info">
                      <strong>Customer:</strong> {quotation.customer.name || quotation.customer.companyName}
                    </div>
                  )}

                  <div className="quotation-items">
                    <strong>Items:</strong> {quotation.items?.length || 0} item(s)
                  </div>

                  <div className="quotation-amount">
                    <strong>Total: ₹{quotation.totalAmount?.toLocaleString() || '0'}</strong>
                  </div>

                  {quotation.validUntil && (
                    <div className="valid-until">
                      <strong>Valid Until:</strong>{' '}
                      {new Date(quotation.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="quotation-actions">
                  <button
                    onClick={() => handleViewQuotation(quotation._id)}
                    className="action-btn view-btn"
                    title="View Details"
                  >
                    <FaEye /> View & Respond
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

export default VendorQuotations;
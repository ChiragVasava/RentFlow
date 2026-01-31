import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { quotationsAPI } from '../utils/api';
import { 
  FaFileInvoice, FaEye, FaClock, FaCheckCircle, FaTimesCircle, 
  FaExchangeAlt, FaHourglassHalf, FaEdit, FaTrash, FaPaperPlane
} from 'react-icons/fa';
import './Quotations.css';

const Quotations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [convertingId, setConvertingId] = useState(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, activeFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationsAPI.getAll();
      setQuotations(response.data.quotations || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const filterQuotations = () => {
    if (activeFilter === 'all') {
      setFilteredQuotations(quotations);
    } else {
      setFilteredQuotations(quotations.filter(q => q.status === activeFilter));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      await quotationsAPI.delete(id);
      toast.success('Quotation deleted successfully');
      fetchQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const handleSubmit = async (id) => {
    if (!window.confirm('Submit this quotation for vendor review?')) {
      return;
    }

    try {
      await quotationsAPI.submit(id);
      toast.success('Quotation submitted for vendor review');
      fetchQuotations();
    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quotation');
    }
  };

  const handleConvertToOrder = async (quotation) => {
    if (!window.confirm('Convert this approved quotation to an order?')) {
      return;
    }

    try {
      setConvertingId(quotation._id);
      const response = await quotationsAPI.convertToOrder(quotation._id);
      toast.success('Order created successfully');
      fetchQuotations();
      navigate(`/orders/${response.data.order._id}`);
    } catch (error) {
      console.error('Error converting quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setConvertingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { icon: <FaEdit />, class: 'draft', label: 'Draft' },
      pending: { icon: <FaClock />, class: 'pending', label: 'Pending Review' },
      approved: { icon: <FaCheckCircle />, class: 'approved', label: 'Approved' },
      rejected: { icon: <FaTimesCircle />, class: 'rejected', label: 'Rejected' },
      converted: { icon: <FaExchangeAlt />, class: 'converted', label: 'Converted to Order' },
      expired: { icon: <FaHourglassHalf />, class: 'expired', label: 'Expired' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`status-badge status-${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getFilterCounts = () => {
    return {
      all: quotations.length,
      draft: quotations.filter(q => q.status === 'draft').length,
      pending: quotations.filter(q => q.status === 'pending').length,
      approved: quotations.filter(q => q.status === 'approved').length,
      rejected: quotations.filter(q => q.status === 'rejected').length,
      converted: quotations.filter(q => q.status === 'converted').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading quotations...</div>
      </div>
    );
  }

  return (
    <div className="page-container quotations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaFileInvoice /> {user?.role === 'vendor' ? 'Quotation Requests' : 'My Quotations'}
          </h1>
          <p className="page-subtitle">
            {user?.role === 'vendor' 
              ? 'Review and manage customer quotation requests'
              : 'Create and manage rental quotations'
            }
          </p>
        </div>
        {user?.role === 'customer' && (
          <Link to="/cart" className="btn btn-primary">
            <FaFileInvoice /> New Quotation
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All <span className="count">{counts.all}</span>
        </button>
        <button
          className={`filter-tab ${activeFilter === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveFilter('draft')}
        >
          <FaEdit /> Draft <span className="count">{counts.draft}</span>
        </button>
        <button
          className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          <FaClock /> Pending <span className="count">{counts.pending}</span>
        </button>
        <button
          className={`filter-tab ${activeFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveFilter('approved')}
        >
          <FaCheckCircle /> Approved <span className="count">{counts.approved}</span>
        </button>
        <button
          className={`filter-tab ${activeFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rejected')}
        >
          <FaTimesCircle /> Rejected <span className="count">{counts.rejected}</span>
        </button>
        <button
          className={`filter-tab ${activeFilter === 'converted' ? 'active' : ''}`}
          onClick={() => setActiveFilter('converted')}
        >
          <FaExchangeAlt /> Converted <span className="count">{counts.converted}</span>
        </button>
      </div>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <div className="empty-state card">
          <FaFileInvoice className="empty-icon" />
          <h3>No Quotations Found</h3>
          <p>
            {activeFilter === 'all' 
              ? 'You don\'t have any quotations yet'
              : `No ${activeFilter} quotations`
            }
          </p>
          {user?.role === 'customer' && activeFilter === 'all' && (
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="quotations-grid">
          {filteredQuotations.map((quotation) => (
            <div key={quotation._id} className="quotation-card card">
              <div className="quotation-header">
                <div className="quotation-number">
                  <FaFileInvoice />
                  <span>{quotation.quotationNumber}</span>
                </div>
                {getStatusBadge(quotation.status)}
              </div>

              <div className="quotation-info">
                {user?.role === 'vendor' && (
                  <div className="info-row">
                    <span className="label">Customer:</span>
                    <span className="value">{quotation.customer?.name || quotation.customer?.companyName}</span>
                  </div>
                )}
                {user?.role === 'customer' && quotation.vendor && (
                  <div className="info-row">
                    <span className="label">Vendor:</span>
                    <span className="value">{quotation.vendor?.name || quotation.vendor?.companyName}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Items:</span>
                  <span className="value">{quotation.items?.length} products</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Amount:</span>
                  <span className="value amount">₹{quotation.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="label">Created:</span>
                  <span className="value">{new Date(quotation.createdAt).toLocaleDateString()}</span>
                </div>
                {quotation.validUntil && quotation.status === 'draft' && (
                  <div className="info-row">
                    <span className="label">Valid Until:</span>
                    <span className="value">{new Date(quotation.validUntil).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {quotation.status === 'rejected' && quotation.rejectionReason && (
                <div className="rejection-notice">
                  <strong>Rejection Reason:</strong>
                  <p>{quotation.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="quotation-actions">
                <Link 
                  to={`/quotations/${quotation._id}`}
                  className="btn btn-outline btn-sm"
                >
                  <FaEye /> View Details
                </Link>

                {/* Customer Actions */}
                {user?.role === 'customer' && (
                  <>
                    {quotation.status === 'draft' && (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSubmit(quotation._id)}
                        >
                          <FaPaperPlane /> Submit
                        </button>
                        <Link
                          to={`/quotations/${quotation._id}/edit`}
                          className="btn btn-secondary btn-sm"
                        >
                          <FaEdit /> Edit
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(quotation._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </>
                    )}
                    {quotation.status === 'approved' && !quotation.convertedToOrder && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConvertToOrder(quotation)}
                        disabled={convertingId === quotation._id}
                      >
                        <FaExchangeAlt /> {convertingId === quotation._id ? 'Creating...' : 'Create Order'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quotations;

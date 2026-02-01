import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaUndo, 
  FaEye, 
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaClock,
  FaCalendarAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { returnsAPI } from '../../utils/api';
import './VendorReturns.css';

const VendorReturns = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await returnsAPI.getAll();
      setReturns(response.data.returns);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReturn = async (returnId) => {
    if (!window.confirm('Mark this return as completed? This will increase the product stock.')) return;

    try {
      await returnsAPI.complete(returnId);
      toast.success('Return marked as completed and stock updated');
      fetchReturns();
    } catch (error) {
      console.error('Error completing return:', error);
      toast.error(error.response?.data?.message || 'Failed to complete return');
    }
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = 
      returnItem.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || returnItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { icon: <FaClock />, class: 'scheduled', label: 'Scheduled' },
      processing: { icon: <FaClock />, class: 'processing', label: 'Processing' },
      completed: { icon: <FaCheck />, class: 'completed', label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return (
      <span className={`status-badge status-${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading returns...</p>
      </div>
    );
  }

  return (
    <div className="vendor-returns-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaUndo /> Product Returns
          </h1>
          <p className="page-subtitle">Manage customer product returns and track stock</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by return number, customer, or order..."
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
            <option value="scheduled">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon processing">
            <FaClock />
          </div>
          <div className="stat-details">
            <h3>{returns.filter(r => r.status === 'processing').length}</h3>
            <p>Processing</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <FaCheck />
          </div>
          <div className="stat-details">
            <h3>{returns.filter(r => r.status === 'completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon late">
            <FaExclamationTriangle />
          </div>
          <div className="stat-details">
            <h3>{returns.filter(r => r.isLate).length}</h3>
            <p>Late Returns</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <FaUndo />
          </div>
          <div className="stat-details">
            <h3>{returns.length}</h3>
            <p>Total Returns</p>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div className="returns-list">
        {filteredReturns.length === 0 ? (
          <div className="empty-state">
            <FaUndo className="empty-icon" />
            <h3>No Returns Found</h3>
            <p>
              {searchTerm || statusFilter
                ? 'No returns match your current filters.'
                : 'No product returns yet.'}
            </p>
          </div>
        ) : (
          <div className="returns-table">
            <table>
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th>Late Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map(returnItem => (
                  <tr key={returnItem._id} className={returnItem.isLate ? 'late-return' : ''}>
                    <td className="return-number">
                      {returnItem.returnNumber}
                      {returnItem.isLate && (
                        <FaExclamationTriangle className="late-icon" title="Late Return" />
                      )}
                    </td>
                    <td>{returnItem.order?.orderNumber || 'N/A'}</td>
                    <td>{returnItem.customer?.name || 'N/A'}</td>
                    <td>{returnItem.items?.length || 0} item(s)</td>
                    <td>
                      <div className="date-cell">
                        <FaCalendarAlt />
                        {returnItem.expectedReturnDate 
                          ? new Date(returnItem.expectedReturnDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td>{getStatusBadge(returnItem.status)}</td>
                    <td className={returnItem.lateReturnFee > 0 ? 'late-fee' : ''}>
                      {returnItem.lateReturnFee > 0 
                        ? `₹${returnItem.lateReturnFee.toFixed(2)}`
                        : '-'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/vendor/returns/${returnItem._id}`)}
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {returnItem.status === 'processing' && (
                          <button
                            onClick={() => handleCompleteReturn(returnItem._id)}
                            className="action-btn complete-btn"
                            title="Mark as Completed"
                          >
                            <FaCheck />
                          </button>
                        )}
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

export default VendorReturns;

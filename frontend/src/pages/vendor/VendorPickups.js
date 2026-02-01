import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaTruck, 
  FaEye, 
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaClock,
  FaCalendarAlt
} from 'react-icons/fa';
import { pickupsAPI } from '../../utils/api';
import './VendorPickups.css';

const VendorPickups = () => {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const response = await pickupsAPI.getAll();
      setPickups(response.data.pickups);
    } catch (error) {
      console.error('Error fetching pickups:', error);
      toast.error('Failed to fetch pickups');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePickup = async (pickupId) => {
    if (!window.confirm('Mark this pickup as completed? This will decrease the product stock.')) return;

    try {
      await pickupsAPI.complete(pickupId);
      toast.success('Pickup marked as completed and stock updated');
      fetchPickups();
    } catch (error) {
      console.error('Error completing pickup:', error);
      toast.error(error.response?.data?.message || 'Failed to complete pickup');
    }
  };

  const filteredPickups = pickups.filter(pickup => {
    const matchesSearch = 
      pickup.pickupNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || pickup.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { icon: <FaClock />, class: 'scheduled', label: 'Scheduled' },
      completed: { icon: <FaCheck />, class: 'completed', label: 'Completed' },
      cancelled: { icon: <FaTimes />, class: 'cancelled', label: 'Cancelled' }
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
        <p>Loading pickups...</p>
      </div>
    );
  }

  return (
    <div className="vendor-pickups-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaTruck /> Product Pickups
          </h1>
          <p className="page-subtitle">Manage customer product pickups and track stock</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by pickup number, customer, or order..."
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
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon scheduled">
            <FaClock />
          </div>
          <div className="stat-details">
            <h3>{pickups.filter(p => p.status === 'scheduled').length}</h3>
            <p>Scheduled</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <FaCheck />
          </div>
          <div className="stat-details">
            <h3>{pickups.filter(p => p.status === 'completed').length}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <FaTruck />
          </div>
          <div className="stat-details">
            <h3>{pickups.length}</h3>
            <p>Total Pickups</p>
          </div>
        </div>
      </div>

      {/* Pickups List */}
      <div className="pickups-list">
        {filteredPickups.length === 0 ? (
          <div className="empty-state">
            <FaTruck className="empty-icon" />
            <h3>No Pickups Found</h3>
            <p>
              {searchTerm || statusFilter
                ? 'No pickups match your current filters.'
                : 'No product pickups scheduled yet.'}
            </p>
          </div>
        ) : (
          <div className="pickups-table">
            <table>
              <thead>
                <tr>
                  <th>Pickup #</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPickups.map(pickup => (
                  <tr key={pickup._id}>
                    <td className="pickup-number">{pickup.pickupNumber}</td>
                    <td>{pickup.order?.orderNumber || 'N/A'}</td>
                    <td>{pickup.customer?.name || 'N/A'}</td>
                    <td>{pickup.items?.length || 0} item(s)</td>
                    <td>
                      <div className="date-cell">
                        <FaCalendarAlt />
                        {pickup.scheduledDate 
                          ? new Date(pickup.scheduledDate).toLocaleDateString()
                          : new Date(pickup.createdAt).toLocaleDateString()
                        }
                      </div>
                    </td>
                    <td>{getStatusBadge(pickup.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/vendor/pickups/${pickup._id}`)}
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {pickup.status === 'scheduled' && (
                          <button
                            onClick={() => handleCompletePickup(pickup._id)}
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

export default VendorPickups;

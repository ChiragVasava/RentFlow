import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaBox, 
  FaEye, 
  FaTruck,
  FaUndo,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { ordersAPI, pickupsAPI, returnsAPI } from '../../utils/api';
import '../Orders.css';

const VendorOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePickup = async (order) => {
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);

      await pickupsAPI.create({
        orderId: order._id,
        scheduledDate: scheduledDate.toISOString(),
        instructions: 'Please prepare items for pickup',
        notes: 'Pickup scheduled by vendor'
      });

      toast.success('Pickup scheduled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule pickup');
    }
  };

  const handleScheduleReturn = async (order) => {
    try {
      await returnsAPI.create({
        orderId: order._id,
        notes: 'Return scheduled by vendor'
      });

      toast.success('Return scheduled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error scheduling return:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule return');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'pending', label: 'Pending' },
      confirmed: { class: 'confirmed', label: 'Confirmed' },
      picked_up: { class: 'picked-up', label: 'Picked Up' },
      in_use: { class: 'in-use', label: 'In Use' },
      returned: { class: 'returned', label: 'Returned' },
      completed: { class: 'completed', label: 'Completed' },
      cancelled: { class: 'cancelled', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge status-${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaBox /> Rental Orders
          </h1>
          <p className="page-subtitle">Manage customer rental orders, pickups, and returns</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_use">In Use</option>
            <option value="returned">Returned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <FaBox className="empty-icon" />
            <h3>No Orders Found</h3>
            <p>
              {searchTerm || statusFilter
                ? 'No orders match your current filters.'
                : 'No rental orders yet.'}
            </p>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Rental Period</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber}</td>
                    <td>{order.customer?.name || 'N/A'}</td>
                    <td>{order.items?.length || 0} item(s)</td>
                    <td>
                      <div className="date-cell">
                        <FaCalendarAlt />
                        {order.items?.[0]?.rentalStartDate 
                          ? `${new Date(order.items[0].rentalStartDate).toLocaleDateString()} - ${new Date(order.items[0].rentalEndDate).toLocaleDateString()}`
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td>₹{order.totalAmount?.toFixed(2) || '0.00'}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleSchedulePickup(order)}
                            className="action-btn pickup-btn"
                            title="Schedule Pickup"
                          >
                            <FaTruck />
                          </button>
                        )}
                        {order.status === 'picked_up' && (
                          <button
                            onClick={() => handleScheduleReturn(order)}
                            className="action-btn return-btn"
                            title="Schedule Return"
                          >
                            <FaUndo />
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

export default VendorOrders;

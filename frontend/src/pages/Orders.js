import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';
import { FaSearch, FaCog, FaFilter, FaTh, FaList, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import moment from 'moment';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState({
    invoicedPaid: false,
    returnDateFilter: false,
    status: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (filters.invoicedPaid) params.invoicedPaid = 'true';
      if (filters.returnDateFilter) params.returnDateFilter = 'true';
      if (filters.status) params.status = filters.status;
      if (searchTerm) params.search = searchTerm;

      const response = await ordersAPI.getAll(params);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ordersAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleExport = async (format) => {
    try {
      const response = await ordersAPI.export(format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Orders exported as ${format.toUpperCase()}`);
      setShowSettings(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Handle file import (simplified)
      toast.info('Import functionality coming soon');
      setShowSettings(false);
    };
    input.click();
  };

  const handlePickup = async (orderId) => {
    try {
      await ordersAPI.updateStatus(orderId, { status: 'picked_up' });
      toast.success('Order picked up successfully');
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleReturn = async (orderId) => {
    try {
      await ordersAPI.updateStatus(orderId, { status: 'completed' });
      toast.success('Order returned successfully');
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      quotation: '#6C4AE2',
      sale_order: '#F59E0B',
      confirmed: '#10B981',
      invoiced: '#2563EB',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      quotation: 'Quotation',
      sale_order: 'Sale Order',
      confirmed: 'Confirmed',
      invoiced: 'Invoiced',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const groupOrdersByStatus = () => {
    const grouped = {
      quotation: [],
      sale_order: [],
      confirmed: [],
      invoiced: [],
      cancelled: []
    };

    orders.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  };

  const renderOrderCard = (order) => {
    const product = order.items[0]?.product;
    const customerName = order.customer?.name || 'N/A';
    const productName = product?.name || 'N/A';
    const duration = order.items[0]?.rentalDuration;

    return (
      <div key={order._id} className="order-card">
        <div className="order-card-header">
          <span className="order-id">{order.orderId}</span>
          <span
            className="order-status-badge"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="order-card-body">
          <div className="order-info">
            <div className="info-row">
              <span className="label">Customer:</span>
              <span className="value">{customerName}</span>
            </div>
            <div className="info-row">
              <span className="label">Product:</span>
              <span className="value">{productName}</span>
            </div>
            <div className="info-row">
              <span className="label">Price:</span>
              <span className="value price">₹{order.totalAmount}</span>
            </div>
            {duration && (
              <div className="info-row">
                <span className="label">Duration:</span>
                <span className="value">{duration.value} {duration.unit}(s)</span>
              </div>
            )}
            {order.returnDate && (
              <div className="info-row">
                <span className="label">Return:</span>
                <span className="value">{moment(order.returnDate).format('MMM DD, YYYY')}</span>
              </div>
            )}
          </div>
        </div>

        {(user?.role === 'vendor' || user?.role === 'admin') && (
          <div className="order-card-actions">
            {order.status === 'confirmed' && (
              <button
                className="btn-pickup"
                onClick={() => handlePickup(order._id)}
              >
                Pickup
              </button>
            )}
            {order.status === 'picked_up' && (
              <button
                className="btn-return"
                onClick={() => handleReturn(order._id)}
              >
                Return
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderKanbanView = () => {
    const groupedOrders = groupOrdersByStatus();

    return (
      <div className="kanban-view">
        {Object.entries(groupedOrders).map(([status, statusOrders]) => (
          <div key={status} className="kanban-column">
            <div
              className="kanban-column-header"
              style={{ borderTopColor: getStatusColor(status) }}
            >
              <h3>{getStatusLabel(status)}</h3>
              <span className="count">{statusOrders.length}</span>
            </div>
            <div className="kanban-column-body">
              {statusOrders.map(order => renderOrderCard(order))}
              {statusOrders.length === 0 && (
                <div className="empty-column">No orders</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="list-view">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Price</th>
              <th>Status</th>
              <th>Return Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const product = order.items[0]?.product;
              return (
                <tr key={order._id}>
                  <td>{order.orderId}</td>
                  <td>{order.customer?.name || 'N/A'}</td>
                  <td>{product?.name || 'N/A'}</td>
                  <td>₹{order.totalAmount}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{order.returnDate ? moment(order.returnDate).format('MMM DD, YYYY') : 'N/A'}</td>
                  <td>
                    {(user?.role === 'vendor' || user?.role === 'admin') && (
                      <>
                        {order.status === 'confirmed' && (
                          <button
                            className="btn-sm btn-pickup"
                            onClick={() => handlePickup(order._id)}
                          >
                            Pickup
                          </button>
                        )}
                        {order.status === 'picked_up' && (
                          <button
                            className="btn-sm btn-return"
                            onClick={() => handleReturn(order._id)}
                          >
                            Return
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="empty-state">No orders found</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="header-left">
          <h1>Rental Orders</h1>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <FaCog />
          </button>
          {showSettings && (
            <div className="settings-dropdown">
              <button onClick={() => handleExport('csv')}>
                <FaDownload /> Export CSV
              </button>
              <button onClick={() => handleExport('excel')}>
                <FaDownload /> Export Excel
              </button>
              <button onClick={handleImport}>
                <FaUpload /> Import Records
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </form>

        <div className="header-actions">
          <button
            className="filter-btn"
            onClick={() => setFilters({ ...filters, invoicedPaid: !filters.invoicedPaid })}
            style={{ backgroundColor: filters.invoicedPaid ? '#2563EB' : '#fff', color: filters.invoicedPaid ? '#fff' : '#000' }}
          >
            <FaFilter /> Invoiced & Paid
          </button>
          <button
            className="filter-btn"
            onClick={() => setFilters({ ...filters, returnDateFilter: !filters.returnDateFilter })}
            style={{ backgroundColor: filters.returnDateFilter ? '#EF4444' : '#fff', color: filters.returnDateFilter ? '#fff' : '#000' }}
          >
            <FaFilter /> Return Due
          </button>
          <div className="view-switcher">
            <button
              className={view === 'kanban' ? 'active' : ''}
              onClick={() => setView('kanban')}
            >
              <FaTh />
            </button>
            <button
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar and Content */}
      <div className="orders-content">
        <div className="sidebar">
          <h3>Rental Status</h3>
          <div className="stats-list">
            <div className="stat-item" onClick={() => setFilters({ ...filters, status: '' })}>
              <span className="stat-label">Total</span>
              <span className="stat-value">{stats.total || 0}</span>
            </div>
            <div className="stat-item" onClick={() => setFilters({ ...filters, status: 'sale_order' })}>
              <span className="stat-label">Sale Order</span>
              <span className="stat-value">{stats.sale_order || 0}</span>
            </div>
            <div className="stat-item" onClick={() => setFilters({ ...filters, status: 'quotation' })}>
              <span className="stat-label">Quotation</span>
              <span className="stat-value">{stats.quotation || 0}</span>
            </div>
            <div className="stat-item" onClick={() => setFilters({ ...filters, status: 'invoiced' })}>
              <span className="stat-label">Invoiced</span>
              <span className="stat-value">{stats.invoiced || 0}</span>
            </div>
            <div className="stat-item" onClick={() => setFilters({ ...filters, status: 'confirmed' })}>
              <span className="stat-label">Confirmed</span>
              <span className="stat-value">{stats.confirmed || 0}</span>
            </div>
            <div className="stat-item" onClick={() => setFilters({ ...filters, status: 'cancelled' })}>
              <span className="stat-label">Cancelled</span>
              <span className="stat-value">{stats.cancelled || 0}</span>
            </div>
          </div>
        </div>

        <div className="main-content">
          {view === 'kanban' ? renderKanbanView() : renderListView()}
        </div>
      </div>
    </div>
  );
};

export default Orders;


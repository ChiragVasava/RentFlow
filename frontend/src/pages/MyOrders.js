import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaThLarge,
  FaList,
  FaFilter,
  FaSearch,
  FaEye,
  FaDownload,
  FaUpload,
  FaShoppingCart,
  FaTruck,
  FaEdit,
  FaCheck,
  FaTimes,
  FaClock,
  FaExchangeAlt
} from 'react-icons/fa';
import { ordersAPI, saleOrdersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [orderType, setOrderType] = useState('all'); // 'all', 'rental', 'sale'
  const [orders, setOrders] = useState([]);
  const [saleOrders, setSaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      const [ordersResponse, saleOrdersResponse] = await Promise.all([
        ordersAPI.getAll(),
        saleOrdersAPI.getAll()
      ]);

      setOrders(ordersResponse.data.orders || []);
      setSaleOrders(saleOrdersResponse.data.saleOrders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Combine and filter orders
  const getAllOrders = () => {
    let allOrders = [];

    if (orderType === 'all' || orderType === 'rental') {
      allOrders = [...allOrders, ...orders.map(order => ({
        ...order,
        orderType: 'rental',
        displayNumber: order.orderNumber,
        displayTotal: order.totalAmount
      }))];
    }

    if (orderType === 'all' || orderType === 'sale') {
      allOrders = [...allOrders, ...saleOrders.map(order => ({
        ...order,
        orderType: 'sale',
        displayNumber: order.orderNumber,
        displayTotal: order.totalAmount
      }))];
    }

    return allOrders;
  };

  const filteredOrders = getAllOrders().filter(order => {
    const matchesSearch = order.displayNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.vendor?.name && order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group orders by status for Kanban view
  const groupOrdersByStatus = () => {
    const groups = {
      draft: [],
      confirmed: [],
      processing: [],
      shipped: [],
      delivered: [],
      cancelled: []
    };

    // Add rental-specific statuses
    if (orderType === 'all' || orderType === 'rental') {
      groups.picked_up = [];
      groups.active = [];
      groups.completed = [];
    }

    filteredOrders.forEach(order => {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    });

    return groups;
  };

  const getStatusConfig = (status, orderType) => {
    const configs = {
      draft: { icon: <FaEdit />, class: 'draft', label: 'Draft', color: '#6b7280' },
      confirmed: { icon: <FaCheck />, class: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
      processing: { icon: <FaClock />, class: 'processing', label: 'Processing', color: '#f59e0b' },
      picked_up: { icon: <FaTruck />, class: 'picked-up', label: 'Picked Up', color: '#8b5cf6' },
      shipped: { icon: <FaTruck />, class: 'shipped', label: 'Shipped', color: '#8b5cf6' },
      active: { icon: <FaExchangeAlt />, class: 'active', label: 'Active', color: '#10b981' },
      delivered: { icon: <FaCheck />, class: 'delivered', label: 'Delivered', color: '#10b981' },
      completed: { icon: <FaCheck />, class: 'completed', label: 'Completed', color: '#10b981' },
      cancelled: { icon: <FaTimes />, class: 'cancelled', label: 'Cancelled', color: '#ef4444' }
    };

    return configs[status] || configs.draft;
  };

  const handleViewOrder = (order) => {
    if (order.orderType === 'sale') {
      navigate(`/sale-orders/${order._id}`);
    } else {
      navigate(`/orders/${order._id}`);
    }
  };

  const exportData = () => {
    const csvContent = filteredOrders.map(order => ({
      'Order Number': order.displayNumber,
      'Type': order.orderType.toUpperCase(),
      'Status': order.status,
      'Customer': order.customer?.name || order.customer?.companyName,
      'Vendor': order.vendor?.name || order.vendor?.companyName,
      'Total': order.displayTotal,
      'Created': new Date(order.createdAt).toLocaleDateString()
    }));

    const headers = Object.keys(csvContent[0] || {});
    const csvString = [
      headers.join(','),
      ...csvContent.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Orders exported successfully!');
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
    <div className="my-orders-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaShoppingCart /> My Orders
          </h1>
          <p className="page-subtitle">Manage your rental and sale orders with advanced views</p>
        </div>

        {/* View Toggle and Controls */}
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <FaThLarge /> Kanban View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList /> List View
            </button>
          </div>

          <div className="export-import">
            <button onClick={exportData} className="export-btn">
              <FaDownload /> Export Records
            </button>
            <button className="import-btn">
              <FaUpload /> Import Records
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="rental">Rental Orders</option>
            <option value="sale">Sale Orders</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            {(orderType === 'all' || orderType === 'rental') && (
              <>
                <option value="picked_up">Picked Up</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </>
            )}
            {(orderType === 'all' || orderType === 'sale') && (
              <>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </>
            )}
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Content */}
      {viewMode === 'kanban' ? (
        <KanbanView 
          groups={groupOrdersByStatus()}
          getStatusConfig={getStatusConfig}
          onViewOrder={handleViewOrder}
          user={user}
        />
      ) : (
        <ListView 
          orders={filteredOrders}
          getStatusConfig={getStatusConfig}
          onViewOrder={handleViewOrder}
          user={user}
        />
      )}
    </div>
  );
};

// Kanban View Component
const KanbanView = ({ groups, getStatusConfig, onViewOrder, user }) => {
  return (
    <div className="kanban-container">
      <div className="kanban-board">
        {Object.entries(groups).map(([status, orders]) => {
          const config = getStatusConfig(status);
          
          if (orders.length === 0) return null;

          return (
            <div key={status} className="kanban-column">
              <div 
                className="column-header"
                style={{ borderTopColor: config.color }}
              >
                <div className="column-title">
                  {config.icon} {config.label}
                </div>
                <div className="column-count">{orders.length}</div>
              </div>
              
              <div className="column-content">
                {orders.map(order => (
                  <div key={`${order.orderType}-${order._id}`} className="kanban-card">
                    <div className="card-header">
                      <span className="order-number">{order.displayNumber}</span>
                      <span className={`order-type ${order.orderType}`}>
                        {order.orderType.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="card-content">
                      {user?.role === 'vendor' && order.customer && (
                        <div className="party-info">
                          <strong>Customer:</strong> {order.customer.name || order.customer.companyName}
                        </div>
                      )}
                      {user?.role === 'customer' && order.vendor && (
                        <div className="party-info">
                          <strong>Vendor:</strong> {order.vendor.name || order.vendor.companyName}
                        </div>
                      )}
                      
                      <div className="order-details">
                        <div><strong>Items:</strong> {order.items?.length || 0}</div>
                        <div><strong>Total:</strong> ₹{(order.displayTotal || 0).toLocaleString()}</div>
                        <div><strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="action-btn view-btn"
                      >
                        <FaEye /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// List View Component
const ListView = ({ orders, getStatusConfig, onViewOrder, user }) => {
  // Helper function to get status badge color class
  const getStatusColorClass = (order) => {
    const statusMap = {
      'draft': 'quotation',
      'pending': 'quotation',
      'confirmed': 'sale-order',
      'processing': 'sale-order',
      'picked_up': 'sale-order-confirmed',
      'active': 'sale-order-confirmed',
      'completed': 'sale-order-confirmed',
      'shipped': 'invoiced',
      'delivered': 'invoiced',
      'cancelled': 'sale-order-cancelled',
      'rejected': 'sale-order-cancelled'
    };
    return statusMap[order.status] || 'quotation';
  };

  return (
    <div className="list-view-container">
      <div className="list-legend">
        <h4>Color Legend:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color quotation"></div>
            <span>Quotation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color sale-order"></div>
            <span>Sale Order</span>
          </div>
          <div className="legend-item">
            <div className="legend-color sale-order-confirmed"></div>
            <span>Sale order Confirmed</span>
          </div>
          <div className="legend-item">
            <div className="legend-color invoiced"></div>
            <span>Invoiced</span>
          </div>
          <div className="legend-item">
            <div className="legend-color sale-order-cancelled"></div>
            <span>Sale order cancelled</span>
          </div>
        </div>
      </div>

      <div className="orders-list">
        {orders.map(order => {
          const config = getStatusConfig(order.status, order.orderType);
          const colorClass = getStatusColorClass(order);
          
          return (
            <div 
              key={`${order.orderType}-${order._id}`} 
              className="order-card"
              onClick={() => onViewOrder(order)}
            >
              <div className="order-grid">
                <div className="order-col">
                  <div className="order-field">
                    <span className="field-label">Order Reference:</span>
                    <span className="field-value">{order.displayNumber}</span>
                  </div>
                  <div className="order-field">
                    <span className="field-label">Product:</span>
                    <span className="field-value">{order.items?.[0]?.product?.name || 'Multiple Items'}</span>
                  </div>
                </div>
                
                <div className="order-col">
                  <div className="order-field">
                    <span className="field-label">Order Date:</span>
                    <span className="field-value">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="order-field">
                    <span className="field-label">Total:</span>
                    <span className="field-value">₹{(order.displayTotal || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="order-col">
                  <div className="order-field">
                    <span className="field-label">Customer Name:</span>
                    <span className="field-value">
                      {user?.role === 'vendor' ? 
                        (order.customer?.name || order.customer?.companyName || 'N/A') :
                        (order.vendor?.name || order.vendor?.companyName || 'N/A')
                      }
                    </span>
                  </div>
                </div>
                
                <div className="order-col status-col">
                  <div className="order-field status-field">
                    <span className="field-label">Rental Status:</span>
                    <span className={`status-tag ${colorClass}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <FaShoppingCart className="empty-icon" />
          <h3>No Orders Found</h3>
          <p>No orders match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEye, FaFileInvoice, FaDownload, FaPrint } from 'react-icons/fa';
import { invoicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Invoices.css';

const Invoices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getAll();
      if (response.data.success) {
        setInvoices(response.data.invoices);
        calculateStats(response.data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesList) => {
    const now = new Date();
    const stats = {
      total: invoicesList.length,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };

    invoicesList.forEach(invoice => {
      stats.totalAmount += invoice.totalAmount;
      stats.paidAmount += invoice.paidAmount;
      stats.pendingAmount += invoice.balanceAmount;

      if (invoice.status === 'paid') {
        stats.paid++;
      } else if (invoice.status === 'overdue' || (invoice.dueDate && new Date(invoice.dueDate) < now && invoice.status !== 'paid')) {
        stats.overdue++;
      } else {
        stats.pending++;
      }
    });

    setStats(stats);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleViewInvoice = (id) => {
    navigate(`/invoices/${id}`);
  };

  const getStatusBadge = (invoice) => {
    const now = new Date();
    let status = invoice.status;

    if (status !== 'paid' && invoice.dueDate && new Date(invoice.dueDate) < now) {
      status = 'overdue';
    }

    return <span className={`invoice-status ${status}`}>{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading invoices...</div>;
  }

  return (
    <div className="invoices-page">
      <div className="invoices-header">
        <h1>Invoices</h1>
      </div>

      {/* Stats Cards */}
      <div className="invoices-stats">
        <div className="stat-card total">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-amount">{formatCurrency(stats.totalAmount)}</div>
        </div>
        <div className="stat-card paid">
          <div className="stat-label">Paid</div>
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-amount">{formatCurrency(stats.paidAmount)}</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-amount">{formatCurrency(stats.pendingAmount)}</div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{stats.overdue}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="invoices-filters">
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaFileInvoice />
          </div>
          <h3>No invoices found</h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Invoices will appear here once created from orders'}
          </p>
        </div>
      ) : (
        <div className="invoices-table-container">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>{user?.role === 'vendor' ? 'Customer' : 'Vendor'}</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice._id} onClick={() => handleViewInvoice(invoice._id)}>
                  <td>
                    <span className="invoice-number">{invoice.invoiceNumber}</span>
                  </td>
                  <td>
                    <div className="invoice-customer">
                      {user?.role === 'vendor' 
                        ? invoice.customer?.companyName || invoice.customer?.name
                        : invoice.vendor?.companyName || invoice.vendor?.name}
                    </div>
                  </td>
                  <td>
                    <span className="invoice-date">{formatDate(invoice.invoiceDate)}</span>
                  </td>
                  <td>
                    <span className="invoice-date">{formatDate(invoice.dueDate)}</span>
                  </td>
                  <td>
                    <span className="invoice-amount">{formatCurrency(invoice.totalAmount)}</span>
                  </td>
                  <td>
                    <span className="invoice-amount">{formatCurrency(invoice.paidAmount)}</span>
                  </td>
                  <td>
                    <span className="invoice-amount">{formatCurrency(invoice.balanceAmount)}</span>
                  </td>
                  <td>{getStatusBadge(invoice)}</td>
                  <td>
                    <div className="invoice-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-btn"
                        onClick={() => handleViewInvoice(invoice._id)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;

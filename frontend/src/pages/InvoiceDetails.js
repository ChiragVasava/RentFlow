import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaPrint, 
  FaDownload, 
  FaMoneyBillWave, 
  FaPaperPlane 
} from 'react-icons/fa';
import { invoicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './InvoiceDetails.css';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'online',
    transactionId: '',
    notes: ''
  });
  const [paymentType, setPaymentType] = useState('full');

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getOne(id);
      if (response.data.success) {
        setInvoice(response.data.invoice);
        setPaymentData(prev => ({
          ...prev,
          amount: response.data.invoice.balanceAmount
        }));
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a downloadable version
    const printWindow = window.open('', '', 'height=650,width=900');
    const invoiceContent = document.querySelector('.invoice-container').innerHTML;
    
    printWindow.document.write('<html><head><title>Invoice</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; }
      .invoice-header-section { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
      .company-info h1 { font-size: 24px; margin: 0; }
      .invoice-title { font-size: 32px; color: #3b82f6; }
      .parties-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
      .party-details { background: #f9fafb; padding: 15px; border-radius: 8px; }
      .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .items-table th { background: #f9fafb; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
      .items-table td { padding: 10px; border-bottom: 1px solid #f3f4f6; }
      .summary-table { width: 400px; margin-left: auto; }
      .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
      .summary-row.total { border-top: 2px solid #3b82f6; font-size: 18px; font-weight: bold; margin-top: 10px; padding: 15px 0; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(invoiceContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    toast.success('Download ready');
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentData.amount > invoice.balanceAmount) {
      toast.error('Payment amount cannot exceed balance amount');
      return;
    }

    try {
      const response = await invoicesAPI.addPayment(id, paymentData);
      if (response.data.success) {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        fetchInvoice();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleSendInvoice = async () => {
    try {
      await invoicesAPI.updateStatus(id, { status: 'sent' });
      toast.success('Invoice sent successfully');
      fetchInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusClass = () => {
    const now = new Date();
    if (invoice.status === 'paid') return 'paid';
    if (invoice.status !== 'paid' && invoice.dueDate && new Date(invoice.dueDate) < now) return 'overdue';
    return invoice.status;
  };

  if (loading) {
    return <div className="loading">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="loading">Invoice not found</div>;
  }

  return (
    <div className="invoice-details-page">
      <div className="invoice-actions-bar">
        <button className="back-button" onClick={() => navigate('/invoices')}>
          <FaArrowLeft /> Back to Invoices
        </button>
        <div className="invoice-action-buttons">
          <button className="action-button print" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="action-button download" onClick={handleDownload}>
            <FaDownload /> Download
          </button>
          {user?.role === 'vendor' && invoice.status !== 'paid' && (
            <>
              {invoice.status === 'draft' && (
                <button className="action-button send" onClick={handleSendInvoice}>
                  <FaPaperPlane /> Send Invoice
                </button>
              )}
              <button 
                className="action-button payment" 
                onClick={() => setShowPaymentModal(true)}
              >
                <FaMoneyBillWave /> Record Payment
              </button>
            </>
          )}
        </div>
      </div>

      <div className="invoice-container">
        {/* Header */}
        <div className="invoice-header-section">
          <div className="company-info">
            <h1>{invoice.vendor?.companyName || invoice.vendor?.name}</h1>
            <p>{invoice.vendor?.email}</p>
            <p>{invoice.vendor?.phone}</p>
            {invoice.vendor?.address && <p>{invoice.vendor.address}</p>}
            {invoice.vendor?.gstin && <p>GSTIN: {invoice.vendor.gstin}</p>}
          </div>
          <div className="invoice-meta">
            <h2 className="invoice-title">INVOICE</h2>
            <div className="invoice-meta-item">
              <span className="meta-label">Invoice #:</span>
              <span className="meta-value">{invoice.invoiceNumber}</span>
            </div>
            <div className="invoice-meta-item">
              <span className="meta-label">Date:</span>
              <span className="meta-value">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="invoice-meta-item">
              <span className="meta-label">Due Date:</span>
              <span className="meta-value">{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="invoice-status-badge">
              <span className={`invoice-status-badge ${getStatusClass()}`}>
                {getStatusClass()}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To / Bill From */}
        <div className="parties-info">
          <div className="party-section">
            <h3>Bill To</h3>
            <div className="party-details">
              <div className="party-name">
                {invoice.customer?.companyName || invoice.customer?.name}
              </div>
              <p>{invoice.customer?.email}</p>
              {invoice.customer?.phone && <p>{invoice.customer.phone}</p>}
              {invoice.customer?.address && <p>{invoice.customer.address}</p>}
              {invoice.customer?.gstin && <p>GSTIN: {invoice.customer.gstin}</p>}
            </div>
          </div>
          <div className="party-section">
            <h3>Payment Information</h3>
            <div className="party-details">
              <p><strong>Payment Method:</strong> {invoice.paymentMethod?.toUpperCase()}</p>
              <p><strong>Payment Type:</strong> {invoice.paymentType?.toUpperCase()}</p>
              {invoice.bankDetails && (
                <>
                  <p><strong>Bank:</strong> {invoice.bankDetails.bankName}</p>
                  <p><strong>A/C:</strong> {invoice.bankDetails.accountNumber}</p>
                  <p><strong>IFSC:</strong> {invoice.bankDetails.ifscCode}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="invoice-items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Rental Period</th>
                <th className="right">Qty</th>
                <th className="right">Rate</th>
                <th className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="product-name">{item.productName}</div>
                  </td>
                  <td>
                    <div className="rental-period">{item.rentalPeriod}</div>
                  </td>
                  <td className="right">{item.quantity}</td>
                  <td className="right">{formatCurrency(item.pricePerUnit)}</td>
                  <td className="right">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="invoice-summary">
          <div className="summary-table">
            <div className="summary-row">
              <span className="summary-label">Subtotal:</span>
              <span className="summary-value">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="summary-row">
                <span className="summary-label">
                  Discount ({invoice.discountType === 'percentage' ? `${invoice.discount}%` : 'Fixed'}):
                </span>
                <span className="summary-value">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.cgst > 0 && (
              <>
                <div className="summary-row">
                  <span className="summary-label">CGST ({invoice.taxRate / 2}%):</span>
                  <span className="summary-value">{formatCurrency(invoice.cgst)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">SGST ({invoice.taxRate / 2}%):</span>
                  <span className="summary-value">{formatCurrency(invoice.sgst)}</span>
                </div>
              </>
            )}
            {invoice.igst > 0 && (
              <div className="summary-row">
                <span className="summary-label">IGST ({invoice.taxRate}%):</span>
                <span className="summary-value">{formatCurrency(invoice.igst)}</span>
              </div>
            )}
            {invoice.securityDeposit > 0 && (
              <div className="summary-row">
                <span className="summary-label">Security Deposit:</span>
                <span className="summary-value">{formatCurrency(invoice.securityDeposit)}</span>
              </div>
            )}
            {invoice.lateReturnFee > 0 && (
              <div className="summary-row">
                <span className="summary-label">Late Return Fee:</span>
                <span className="summary-value">{formatCurrency(invoice.lateReturnFee)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span className="summary-label">Total:</span>
              <span className="summary-value">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <>
                <div className="summary-row">
                  <span className="summary-label">Paid:</span>
                  <span className="summary-value" style={{ color: '#10b981' }}>
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div className="summary-row total">
                  <span className="summary-label">Balance Due:</span>
                  <span className="summary-value" style={{ color: invoice.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                    {formatCurrency(invoice.balanceAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="payment-history-section">
            <h3>Payment History</h3>
            {invoice.payments.map((payment, index) => (
              <div key={index} className="payment-record">
                <div className="payment-info">
                  <span className="payment-date">
                    {formatDate(payment.date)}
                  </span>
                  <span className="payment-method">
                    {payment.method.toUpperCase()}
                  </span>
                  {payment.transactionId && (
                    <span className="payment-method">
                      Txn: {payment.transactionId}
                    </span>
                  )}
                </div>
                <span className="payment-amount">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="notes-section">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Record Payment</h2>
            <form onSubmit={handleAddPayment}>
              <div className="payment-type-selector">
                <div 
                  className={`payment-type-option ${paymentType === 'full' ? 'selected' : ''}`}
                  onClick={() => {
                    setPaymentType('full');
                    setPaymentData(prev => ({ ...prev, amount: invoice.balanceAmount }));
                  }}
                >
                  <div>Full Payment</div>
                  <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                    {formatCurrency(invoice.balanceAmount)}
                  </div>
                </div>
                <div 
                  className={`payment-type-option ${paymentType === 'partial' ? 'selected' : ''}`}
                  onClick={() => {
                    setPaymentType('partial');
                    setPaymentData(prev => ({ ...prev, amount: '' }));
                  }}
                >
                  <div>Partial Payment</div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Custom Amount
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                  max={invoice.balanceAmount}
                  step="0.01"
                  disabled={paymentType === 'full'}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Balance Due: {formatCurrency(invoice.balanceAmount)}
                </small>
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online Transfer</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction ID / Reference</label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  placeholder="Enter transaction ID or reference number"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Add any notes about this payment"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-button secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-button primary">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;

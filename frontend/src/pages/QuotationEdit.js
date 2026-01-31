import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './QuotationEdit.css';

const QuotationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    notes: '',
    validUntil: '',
    items: []
  });

  useEffect(() => {
    fetchQuotationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchQuotationDetails = async () => {
    try {
      setLoading(true);
      const response = await quotationsAPI.getOne(id);
      const quotationData = response.data.quotation || response.data;
      
      // Check if user can edit this quotation
      if (user?.role === 'customer' && quotationData.customer._id !== user.id) {
        toast.error('You can only edit your own quotations');
        navigate('/quotations');
        return;
      }

      if (quotationData.status !== 'draft') {
        toast.error('Only draft quotations can be edited');
        navigate(`/quotations/${id}`);
        return;
      }

      setQuotation(quotationData);
      setFormData({
        notes: quotationData.notes || '',
        validUntil: quotationData.validUntil ? 
          new Date(quotationData.validUntil).toISOString().split('T')[0] : '',
        items: quotationData.items || []
      });
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to fetch quotation details');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const calculateItemTotal = (item) => {
    return (item.quantity || 0) * (item.pricePerUnit || 0);
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTax = (subtotal) => {
    return subtotal * 0.18; // 18% tax
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Calculate totals
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax(subtotal);
      const totalAmount = subtotal + taxAmount;

      // Update item totals
      const updatedItems = formData.items.map(item => ({
        ...item,
        totalPrice: calculateItemTotal(item)
      }));

      const updateData = {
        notes: formData.notes,
        validUntil: formData.validUntil || null,
        items: updatedItems,
        subtotal,
        taxAmount,
        totalAmount
      };

      await quotationsAPI.update(id, updateData);
      toast.success('Quotation updated successfully');
      navigate(`/quotations/${id}`);
    } catch (error) {
      console.error('Error updating quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to update quotation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading quotation...</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Quotation not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/quotations')}>
            Back to Quotations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container quotation-edit-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-text" onClick={() => navigate(`/quotations/${id}`)}>
          <FaArrowLeft /> Back to Details
        </button>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card edit-form">
        <div className="form-header">
          <h1 className="form-title">
            <FaEdit /> Edit Quotation {quotation.quotationNumber}
          </h1>
        </div>

        {/* Items Section */}
        <div className="form-section">
          <h2 className="section-title">Items</h2>
          
          {formData.items.length === 0 ? (
            <div className="no-items">
              <p>No items in this quotation</p>
            </div>
          ) : (
            <div className="items-list">
              {formData.items.map((item, index) => (
                <div key={index} className="item-edit-card">
                  <div className="item-header">
                    <h3>{item.product?.name || 'Product'}</h3>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => removeItem(index)}
                    >
                      <FaTimes /> Remove
                    </button>
                  </div>
                  
                  <div className="item-form">
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Price per Unit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.pricePerUnit || 0}
                        onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Rental Start Date</label>
                      <input
                        type="date"
                        value={item.rentalStartDate ? new Date(item.rentalStartDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleItemChange(index, 'rentalStartDate', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Rental End Date</label>
                      <input
                        type="date"
                        value={item.rentalEndDate ? new Date(item.rentalEndDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleItemChange(index, 'rentalEndDate', e.target.value)}
                      />
                    </div>
                    
                    <div className="item-total">
                      <strong>Total: ₹{calculateItemTotal(item).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Details */}
        <div className="form-section">
          <h2 className="section-title">Details</h2>
          
          <div className="form-group">
            <label>Valid Until</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="4"
              placeholder="Additional notes or comments..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="pricing-summary">
          <h2 className="section-title">Pricing Summary</h2>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₹{calculateSubtotal().toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Tax (18%):</span>
            <span>₹{calculateTax(calculateSubtotal()).toLocaleString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <span>₹{(calculateSubtotal() + calculateTax(calculateSubtotal())).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationEdit;
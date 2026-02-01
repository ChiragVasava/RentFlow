import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaShoppingCart, 
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStickyNote,
  FaCreditCard,
  FaSave
} from 'react-icons/fa';
import { saleOrdersAPI, usersAPI, productsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './CreateSaleOrder.css';

const CreateSaleOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([
    { productId: '', quantity: 1, pricePerUnit: 0, productName: '' }
  ]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
    
    // Set default delivery date to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setExpectedDeliveryDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user?.id) {
      console.log('Fetching products for vendor:', user.id);
      fetchProducts();
    } else {
      console.log('User or user.id not available yet:', user);
    }
  }, [user]);

  useEffect(() => {
    if (selectedCustomer) {
      // Fetch customer details to populate address
      const customer = customers.find(c => c._id === selectedCustomer);
      if (customer && customer.address) {
        setShippingAddress(customer.address);
        if (sameAsShipping) {
          setBillingAddress(customer.address);
        }
      }
    }
  }, [selectedCustomer, customers, sameAsShipping]);

  const fetchCustomers = async () => {
    try {
      const response = await usersAPI.getAll({ role: 'customer' });
      setCustomers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Starting fetchProducts...');
      console.log('User object:', user);
      console.log('User ID:', user?.id);
      
      if (!user?.id) {
        console.log('No user ID available yet, skipping fetch');
        return;
      }

      // Fetch only vendor's own products for sale orders
      console.log('Making API call to fetch products with vendor filter:', user.id);
      const response = await productsAPI.getAll({ vendor: user.id });
      console.log('API Response:', response);
      console.log('Response status:', response.status);
      console.log('Products data:', response.data);
      console.log('Products array:', response.data.products);
      console.log('Products array length:', response.data.products?.length);
      
      // Show all vendor products - vendor can sell any of their products
      const productsArray = response.data.products || [];
      console.log('Setting products to state:', productsArray);
      setProducts(productsArray);
      
      if (productsArray.length === 0) {
        console.warn('No products found for vendor:', user.id);
      }
    } catch (error) {
      console.error('Detailed error fetching products:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      toast.error('Failed to load products: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, pricePerUnit: 0, productName: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      productId,
      pricePerUnit: product ? product.salesPrice : 0,
      productName: product ? product.name : ''
    };
    setOrderItems(newItems);
  };

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...orderItems];
    newItems[index].quantity = parseInt(quantity) || 1;
    setOrderItems(newItems);
  };

  const handlePriceChange = (index, price) => {
    const newItems = [...orderItems];
    newItems[index].pricePerUnit = parseFloat(price) || 0;
    setOrderItems(newItems);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.pricePerUnit);
    }, 0);
  };

  const calculateTax = () => {
    // Assuming 18% tax for now - can be made dynamic based on product category
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (orderItems.some(item => !item.productId || item.quantity < 1)) {
      toast.error('Please select products and specify valid quantities');
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error('Please provide a shipping address');
      return;
    }

    if (!expectedDeliveryDate) {
      toast.error('Please select an expected delivery date');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        customerId: selectedCustomer,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        paymentMethod,
        expectedDeliveryDate,
        notes
      };

      const response = await saleOrdersAPI.create(orderData);

      if (response.data.success) {
        toast.success('Sale order created successfully');
        navigate(`/sale-orders/${response.data.saleOrder._id}`);
      }
    } catch (error) {
      console.error('Error creating sale order:', error);
      toast.error(error.response?.data?.message || 'Failed to create sale order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-sale-order-container">
      <div className="page-header">
        <button onClick={() => navigate('/vendor/sale-orders')} className="back-btn">
          <FaArrowLeft /> Back
        </button>
        <h1 className="page-title">
          <FaShoppingCart /> Create Sale Order
        </h1>
        <p className="page-subtitle">Create a new sale order for your customer</p>
      </div>

      <form onSubmit={handleSubmit} className="sale-order-form">
        {/* Customer Selection */}
        <div className="form-section">
          <h2 className="section-title">
            <FaUser /> Customer Information
          </h2>
          <div className="form-group">
            <label>Select Customer *</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="form-control"
              required
            >
              <option value="">-- Select a Customer --</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name || customer.companyName} ({customer.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Order Items */}
        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <FaShoppingCart /> Order Items
            </h2>
            <button type="button" onClick={handleAddItem} className="add-item-btn">
              <FaPlus /> Add Item
            </button>
          </div>

          <div className="items-list">
            {orderItems.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-row">
                  <div className="form-group flex-2">
                    <label>Product *</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">-- Select Product --</option>
                      {!user?.id && (
                        <option disabled>Loading user data...</option>
                      )}
                      {user?.id && products.length === 0 && (
                        <option disabled>No products available</option>
                      )}
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.quantityOnHand})
                        </option>
                      ))}
                    </select>
                    {user?.id && products.length === 0 && (
                      <small style={{color: 'red', marginTop: '5px', display: 'block'}}>
                        Debug: User ID: {user.id} - Products array is empty. Check console for API response.
                      </small>
                    )}
                    {!user?.id && (
                      <small style={{color: 'blue', marginTop: '5px', display: 'block'}}>
                        Debug: Waiting for user authentication...
                      </small>
                    )}
                  </div>

                  <div className="form-group flex-1">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.pricePerUnit}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label>Total</label>
                    <input
                      type="text"
                      value={`₹${(item.quantity * item.pricePerUnit).toFixed(2)}`}
                      className="form-control"
                      disabled
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="remove-item-btn"
                    title="Remove Item"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18%):</span>
              <span>₹{calculateTax().toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="form-section">
          <h2 className="section-title">
            <FaMapMarkerAlt /> Delivery Information
          </h2>

          <div className="form-group">
            <label>Shipping Address *</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="form-control"
              rows="3"
              placeholder="Enter shipping address..."
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => {
                  setSameAsShipping(e.target.checked);
                  if (e.target.checked) {
                    setBillingAddress(shippingAddress);
                  }
                }}
              />
              Billing address same as shipping address
            </label>
          </div>

          {!sameAsShipping && (
            <div className="form-group">
              <label>Billing Address *</label>
              <textarea
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="form-control"
                rows="3"
                placeholder="Enter billing address..."
                required
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>
                <FaCalendarAlt /> Expected Delivery Date *
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaCreditCard /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-control"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="form-section">
          <h2 className="section-title">
            <FaStickyNote /> Additional Notes
          </h2>
          <div className="form-group">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control"
              rows="4"
              placeholder="Add any special instructions, terms, or notes for this sale order..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/vendor/sale-orders')}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <FaSave /> Create Sale Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSaleOrder;

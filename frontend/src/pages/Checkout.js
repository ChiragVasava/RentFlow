import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { quotationsAPI, productsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaMapMarkerAlt, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);

  // Address Form
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  // Payment Form
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, card, upi
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    console.log('Checkout loaded. Cart items:', cartItems);
    
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Validate all cart items have valid product data
    const hasInvalidItems = cartItems.some(item => {
      const productId = item.product?._id || item.product;
      const isInvalid = !productId;
      if (isInvalid) {
        console.error('Invalid cart item detected:', item);
      }
      return isInvalid;
    });
    
    if (hasInvalidItems) {
      toast.error('Some items in your cart have invalid data. Please remove and re-add them.');
      setTimeout(() => navigate('/cart'), 2000);
    }
  }, [cartItems, navigate]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    
    // Validate address
    if (!shippingAddress.fullName || !shippingAddress.phone || 
        !shippingAddress.addressLine1 || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }

    // Validate phone
    if (!/^[0-9]{10}$/.test(shippingAddress.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate pincode
    if (!/^[0-9]{6}$/.test(shippingAddress.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    if (!acceptTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cardName || 
          !cardDetails.expiryDate || !cardDetails.cvv) {
        toast.error('Please fill all card details');
        return;
      }
      if (!/^[0-9]{16}$/.test(cardDetails.cardNumber.replace(/\s/g, ''))) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!/^[0-9]{3,4}$/.test(cardDetails.cvv)) {
        toast.error('Please enter a valid CVV');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        toast.error('Please enter UPI ID');
        return;
      }
    }

    handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      console.log('=== Starting Order Placement ===');
      console.log('Cart items:', cartItems);

      // Validate and prepare cart items
      const validatedItems = [];
      
      for (const item of cartItems) {
        console.log('Processing cart item:', item);

        // Check if product exists and has an ID
        if (!item.product) {
          toast.error('Invalid cart item found. Please refresh your cart.');
          setLoading(false);
          return;
        }

        let productId = item.product._id || item.product;
        
        // If productId is still not valid, try to extract it
        if (!productId || typeof productId !== 'string') {
          console.error('Invalid product in cart:', item);
          toast.error('Some cart items have invalid product data. Please remove and re-add them.');
          setLoading(false);
          return;
        }

        // Validate dates
        if (!item.startDate || !item.endDate) {
          console.error('Missing dates for item:', item);
          toast.error('Some cart items are missing rental dates. Please remove and re-add them.');
          setLoading(false);
          return;
        }

        // Verify the product exists by fetching it
        try {
          await productsAPI.getOne(productId);
          
          // Backend expects rentalStartDate and rentalEndDate (not startDate/endDate)
          const quotationItem = {
            product: productId,
            quantity: item.quantity || 1,
            rentalStartDate: item.startDate,
            rentalEndDate: item.endDate
          };

          console.log('Validated item:', quotationItem);
          validatedItems.push(quotationItem);
        } catch (error) {
          console.error('Product not found:', productId, error);
          toast.error(`Product not found. Please remove it from cart and try again.`);
          setLoading(false);
          return;
        }
      }

      // Backend will calculate subtotal, tax, and total automatically
      const quotationData = {
        items: validatedItems,
        notes: `Shipping Address: ${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}. Payment Method: ${paymentMethod.toUpperCase()}`
      };

      console.log('Creating quotation with data:', quotationData);

      const response = await quotationsAPI.create(quotationData);

      console.log('Quotation created successfully:', response.data);

      setStep(3);
      toast.success('Order placed successfully! Redirecting to your quotations...');
      
      // Clear cart after successful quotation
      setTimeout(() => {
        clearCart();
        navigate('/quotations');
      }, 2000);

    } catch (error) {
      console.error('=== Error creating quotation ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryImage = (product) => {
    if (!product) return 'https://via.placeholder.com/80x80?text=No+Image';
    
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.images[0];
    }
    return 'https://via.placeholder.com/80x80?text=No+Image';
  };

  // Step 3: Order Confirmation
  if (step === 3) {
    return (
      <div className="page-container">
        <div className="checkout-success">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your order. We've received your rental request and will process it shortly.</p>
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              View My Orders
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/products')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Complete your rental order</p>
      </div>

      {/* Progress Steps */}
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-icon">
            <FaMapMarkerAlt />
          </div>
          <span className="step-label">Address</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-icon">
            <FaCreditCard />
          </div>
          <span className="step-label">Payment</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-icon">
            <FaCheckCircle />
          </div>
          <span className="step-label">Confirmation</span>
        </div>
      </div>

      <div className="checkout-layout">
        {/* Main Content */}
        <div className="checkout-main">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div className="checkout-section card">
              <h2 className="section-title">
                <FaMapMarkerAlt /> Shipping Address
              </h2>
              
              <form onSubmit={handleAddressSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})}
                    placeholder="House No., Building Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})}
                    placeholder="Road Name, Area, Colony"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress({...shippingAddress, pincode: e.target.value})}
                      placeholder="6-digit pincode"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="checkout-section card">
              <h2 className="section-title">
                <FaCreditCard /> Payment Method
              </h2>

              <form onSubmit={handlePaymentSubmit}>
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when you receive the items</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>Credit/Debit Card</strong>
                      <span>Pay securely with your card</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>UPI</strong>
                      <span>Pay using Google Pay, PhonePe, Paytm, etc.</span>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="payment-details">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                    </div>

                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        value={cardDetails.cardName}
                        onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})}
                        placeholder="Name on card"
                      />
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                      </div>

                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          placeholder="123"
                          maxLength="4"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="payment-details">
                    <div className="form-group">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                      />
                    </div>
                  </div>
                )}

                <div className="terms-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                    />
                    <span>I accept the <a href="/terms">Terms & Conditions</a> and <a href="/privacy">Privacy Policy</a></span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                    Back to Address
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-sidebar">
          <div className="card">
            <h3 className="sidebar-title">
              <FaShoppingCart /> Order Summary
            </h3>

            <div className="order-items">
              {cartItems.map((item, index) => {
                const product = item.product || {};
                return (
                  <div key={`${product._id}-${index}`} className="order-item">
                    <img src={getPrimaryImage(product)} alt={product.name || 'Product'} />
                    <div className="item-info">
                      <h4>{product.name || 'Unknown Product'}</h4>
                      <p>Qty: {item.quantity}</p>
                      <p className="item-price">₹{(item.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-calculations">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>₹{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="calc-row">
                <span>Tax (18% GST)</span>
                <span>₹{(calculateTotal() * 0.18).toLocaleString()}</span>
              </div>
              <div className="calc-row">
                <span>Delivery Charges</span>
                <span className="free-text">FREE</span>
              </div>
              <hr />
              <div className="calc-row total">
                <span>Total Amount</span>
                <span>₹{(calculateTotal() * 1.18).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

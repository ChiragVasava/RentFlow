import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaTrash, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  // Debug: Log cart items
  useEffect(() => {
    console.log('Cart items:', cartItems);
    cartItems.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        product: item.product,
        quantity: item.quantity,
        startDate: item.startDate,
        endDate: item.endDate,
        price: item.price
      });
    });
  }, [cartItems]);

  const getPrimaryImage = (product) => {
    if (!product) return 'https://via.placeholder.com/150x150?text=No+Image';
    
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.images[0];
    }
    return 'https://via.placeholder.com/150x150?text=No+Image';
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-cart">
          <FaShoppingCart className="empty-cart-icon" />
          <h2>Your cart is empty</h2>
          <p>Add some items to get started!</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/products')}>
          <FaArrowLeft /> Continue Shopping
        </button>
      </div>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h3>Cart Items</h3>
            <button className="btn-text btn-danger" onClick={clearCart}>
              Clear All
            </button>
          </div>

          {cartItems.map((item, index) => {
            const product = item.product || {};
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            const startDate = item.startDate;
            const endDate = item.endDate;
            const pricingType = item.pricingType || 'daily';
            const itemType = item.type || 'rent';

            return (
              <div key={`${product._id}-${index}`} className="cart-item card">
                <div className="cart-item-image">
                  <img src={getPrimaryImage(product)} alt={product.name || 'Product'} />
                  {itemType === 'buy' && (
                    <span className="item-type-badge sale-badge">SALE</span>
                  )}
                  {itemType === 'rent' && (
                    <span className="item-type-badge rent-badge">RENT</span>
                  )}
                </div>

                <div className="cart-item-details">
                  <h3 className="cart-item-name">{product.name || 'Unknown Product'}</h3>
                  <p className="cart-item-category">{product.category || 'N/A'}</p>
                  
                  {itemType === 'rent' && (
                    <div className="rental-period">
                      <div className="rental-date">
                        <span className="label">From:</span>
                        <span className="value">
                          {startDate ? new Date(startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="rental-date">
                        <span className="label">To:</span>
                        <span className="value">
                          {endDate ? new Date(endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="rental-duration">
                        <span className="duration-badge">
                          {pricingType.charAt(0).toUpperCase() + pricingType.slice(1)} Rental
                        </span>
                      </div>
                    </div>
                  )}

                  {itemType === 'buy' && (
                    <div className="purchase-info">
                      <span className="purchase-label">One-time Purchase</span>
                      <span className="unit-price">₹{(price / quantity).toLocaleString()} per unit</span>
                    </div>
                  )}

                  <div className="cart-item-pricing">
                    <span className="quantity-label">Quantity: {quantity}</span>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="cart-item-total">
                    <span className="total-label">Total:</span>
                    <span className="total-price">₹{price.toLocaleString()}</span>
                  </div>

                  <button 
                    className="btn-icon btn-danger"
                    onClick={() => removeFromCart(product._id)}
                    title="Remove from cart"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="cart-summary card">
          <h3>Order Summary</h3>
          
          <div className="summary-row">
            <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
            <span>₹{calculateTotal().toLocaleString()}</span>
          </div>

          <div className="summary-row">
            <span>Tax (18% GST)</span>
            <span>₹{(calculateTotal() * 0.18).toLocaleString()}</span>
          </div>

          <hr className="summary-divider" />

          <div className="summary-row summary-total">
            <span>Total Amount</span>
            <span>₹{(calculateTotal() * 1.18).toLocaleString()}</span>
          </div>

          <button className="btn btn-primary btn-block" onClick={handleCheckout}>
            Proceed to Checkout
          </button>

          <p className="summary-note">
            * Prices are calculated based on rental duration and quantity
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;


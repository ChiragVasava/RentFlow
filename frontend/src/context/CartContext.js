import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load cart from localStorage on initialization
    try {
      const savedCart = localStorage.getItem('cartItems');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // Add item to cart - accepts object with product, quantity, startDate, endDate, pricingType, price
  const addToCart = (item) => {
    const { product, quantity, startDate, endDate, pricingType, price } = item;
    
    console.log('Adding to cart:', { product: product?.name, quantity, startDate, endDate, pricingType, price });
    
    const existingItemIndex = cartItems.findIndex(cartItem => 
      cartItem.product?._id === product?._id &&
      cartItem.startDate === startDate &&
      cartItem.endDate === endDate
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity,
        price: updatedCart[existingItemIndex].price + price
      };
      setCartItems(updatedCart);
    } else {
      // Add new item
      const newItem = {
        product,
        quantity,
        startDate,
        endDate,
        pricingType,
        price
      };
      console.log('New cart item:', newItem);
      setCartItems([...cartItems, newItem]);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product._id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId, quantity) => {
    setCartItems(cartItems.map(item =>
      item.product._id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      // Calculate rental duration
      const start = new Date(item.rentalStartDate);
      const end = new Date(item.rentalEndDate);
      const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      let pricePerUnit = 0;
      let duration = 1;
      
      if (durationInDays < 1) {
        const hours = Math.ceil((end - start) / (1000 * 60 * 60));
        pricePerUnit = item.product.rentalPricing?.hourly || 0;
        duration = hours;
      } else if (durationInDays < 7) {
        pricePerUnit = item.product.rentalPricing?.daily || 0;
        duration = durationInDays;
      } else {
        const weeks = Math.ceil(durationInDays / 7);
        pricePerUnit = item.product.rentalPricing?.weekly || 0;
        duration = weeks;
      }
      
      return total + (pricePerUnit * item.quantity * duration);
    }, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    cartCount: cartItems.length
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;

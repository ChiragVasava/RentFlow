import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaCalendarAlt, FaTag, FaCheckCircle, FaTimesCircle, FaHeart, FaRegHeart, FaShare } from 'react-icons/fa';
import { productsAPI } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPricingType, setSelectedPricingType] = useState('daily');
  const [totalPrice, setTotalPrice] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [mode, setMode] = useState('rent'); // 'rent' or 'buy'

  useEffect(() => {
    fetchProduct();
  }, [id, searchParams]);

  useEffect(() => {
    if (mode === 'rent' && startDate && endDate && product) {
      calculatePrice();
      checkAvailability();
    } else if (mode === 'buy' && product) {
      setTotalPrice(product.salesPrice * quantity);
    }
  }, [startDate, endDate, quantity, selectedPricingType, product, mode]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getOne(id);
      const productData = response.data.product || response.data.data;
      setProduct(productData);
      
      // Set default selected image to primary image
      const primaryIndex = productData.images?.findIndex(img => img.isPrimary);
      if (primaryIndex > -1) {
        setSelectedImage(primaryIndex);
      }

      // Set initial mode based on product availability and query params
      const action = searchParams.get('action');
      if (action === 'buy' && productData.isSellable) {
        setMode('buy');
      } else if (action === 'rent' && productData.isRentable) {
        setMode('rent');
      } else {
        // Default to rent if rentable, otherwise buy
        if (productData.isRentable) {
          setMode('rent');
        } else if (productData.isSellable) {
          setMode('buy');
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) return;
    
    try {
      const response = await productsAPI.checkAvailability(id, {
        quantity,
        startDate,
        endDate
      });
      setIsAvailable(response.data.isAvailable);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(true); // Default to available on error
    }
  };

  const calculatePrice = () => {
    if (!product || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffWeeks = Math.ceil(diffDays / 7);

    let price = 0;

    switch(selectedPricingType) {
      case 'hourly':
        price = (product.rentalPricing.hourly || 0) * diffHours * quantity;
        break;
      case 'daily':
        price = (product.rentalPricing.daily || 0) * diffDays * quantity;
        break;
      case 'weekly':
        price = (product.rentalPricing.weekly || 0) * diffWeeks * quantity;
        break;
      default:
        price = (product.rentalPricing.daily || 0) * diffDays * quantity;
    }

    setTotalPrice(price);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.info('Please login to continue');
      navigate('/login');
      return;
    }

    if (mode === 'rent') {
      if (!startDate || !endDate) {
        toast.error('Please select rental dates');
        return;
      }

      if (!isAvailable) {
        toast.error('Product is not available for selected dates');
        return;
      }

      addToCart({
        product,
        quantity,
        startDate,
        endDate,
        pricingType: selectedPricingType,
        price: totalPrice,
        type: 'rent'
      });

      toast.success('Added to cart!');
    } else {
      // Buy mode
      addToCart({
        product,
        quantity,
        price: product.salesPrice * quantity,
        type: 'buy'
      });

      toast.success('Added to cart!');
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon filled" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon filled" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon" />);
    }

    return stars;
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="error-container">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="product-details-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Home</span>
          <span>/</span>
          <span onClick={() => navigate('/products')}>Products</span>
          <span>/</span>
          <span onClick={() => navigate(`/products?category=${product.category}`)}>{product.category}</span>
          <span>/</span>
          <span className="active">{product.name}</span>
        </div>

        <div className="product-details-grid">
          {/* Image Gallery Section */}
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images?.[selectedImage]?.url || 'https://via.placeholder.com/600x400?text=No+Image'} 
                alt={product.name}
              />
              <div className="image-actions">
                <button 
                  className={`action-btn ${isFavorite ? 'active' : ''}`}
                  onClick={toggleFavorite}
                  title="Add to favorites"
                >
                  {isFavorite ? <FaHeart /> : <FaRegHeart />}
                </button>
                <button 
                  className="action-btn"
                  onClick={handleShare}
                  title="Share product"
                >
                  <FaShare />
                </button>
              </div>
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-gallery">
                {product.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image.url} alt={`${product.name} view ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="product-info">
            <div className="product-header">
              <h1 className="product-name">{product.name}</h1>
              {/* <div className="product-rating">
                <div className="stars">
                  {renderRating(product.ratings?.average || 0)}
                </div>
                <span className="rating-text">
                  {product.ratings?.average?.toFixed(1) || 0} ({product.ratings?.count || 0} reviews)
                </span>
              </div> */}
            </div>

            <div className="product-meta">
              <span className="category-badge">
                <FaTag /> {product.category}
              </span>
              {product.specifications?.condition && (
                <span className={`condition-badge ${product.specifications.condition}`}>
                  {product.specifications.condition.toUpperCase()}
                </span>
              )}
              {product.quantityOnHand > 0 ? (
                <span className="stock-badge in-stock">
                  <FaCheckCircle /> In Stock ({product.quantityOnHand} available)
                </span>
              ) : (
                <span className="stock-badge out-of-stock">
                  <FaTimesCircle /> Out of Stock
                </span>
              )}
            </div>

            <p className="product-description">{product.description}</p>

            {/* Mode Selector - Show if product supports both */}
            {product.availabilityType === 'both' && (
              <div className="mode-selector">
                <button 
                  className={`mode-btn ${mode === 'rent' ? 'active' : ''}`}
                  onClick={() => setMode('rent')}
                >
                  Rent
                </button>
                <button 
                  className={`mode-btn ${mode === 'buy' ? 'active' : ''}`}
                  onClick={() => setMode('buy')}
                >
                  Buy
                </button>
              </div>
            )}

            {/* Pricing Section - Rental */}
            {(mode === 'rent' && product.isRentable) && (
              <div className="pricing-section">
                <h3>Rental Pricing</h3>
                <div className="pricing-options">
                  {product.rentalPricing?.hourly > 0 && (
                    <div 
                      className={`pricing-card ${selectedPricingType === 'hourly' ? 'selected' : ''}`}
                      onClick={() => setSelectedPricingType('hourly')}
                    >
                      <span className="price-label">Hourly</span>
                      <span className="price-value">₹{product.rentalPricing.hourly}/hr</span>
                    </div>
                  )}
                  {product.rentalPricing?.daily > 0 && (
                    <div 
                      className={`pricing-card ${selectedPricingType === 'daily' ? 'selected' : ''}`}
                      onClick={() => setSelectedPricingType('daily')}
                    >
                      <span className="price-label">Daily</span>
                      <span className="price-value">₹{product.rentalPricing.daily}/day</span>
                    </div>
                  )}
                  {product.rentalPricing?.weekly > 0 && (
                    <div 
                      className={`pricing-card ${selectedPricingType === 'weekly' ? 'selected' : ''}`}
                      onClick={() => setSelectedPricingType('weekly')}
                    >
                      <span className="price-label">Weekly</span>
                      <span className="price-value">₹{product.rentalPricing.weekly}/week</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Section - Sale */}
            {(mode === 'buy' && product.isSellable) && (
              <div className="pricing-section">
                <h3>Sale Price</h3>
                <div className="sale-price-display">
                  <span className="price-value">₹{product.salesPrice}</span>
                </div>
              </div>
            )}

            {/* Rental Configuration */}
            {mode === 'rent' && (
              <div className="rental-config">
                <h3>Configure Your Rental</h3>
                
                <div className="config-group">
                  <label>
                    <FaCalendarAlt /> Start Date
                  </label>
                  <input 
                    type="date" 
                    value={startDate}
                    min={getTodayDate()}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>

                <div className="config-group">
                  <label>
                    <FaCalendarAlt /> End Date
                  </label>
                  <input 
                    type="date" 
                    value={endDate}
                    min={startDate || getTodayDate()}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>

                <div className="config-group">
                  <label>Quantity</label>
                  <div className="quantity-selector">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      min="1"
                      max={product.quantityOnHand}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="qty-input"
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(product.quantityOnHand, quantity + 1))}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="availability-check">
                    {isAvailable ? (
                      <div className="available">
                        <FaCheckCircle /> Available for selected dates
                      </div>
                    ) : (
                      <div className="unavailable">
                        <FaTimesCircle /> Not available for selected dates
                      </div>
                    )}
                  </div>
                )}

                {totalPrice > 0 && (
                  <div className="price-summary">
                    <div className="price-row">
                      <span>Rental Price:</span>
                      <span className="price">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="price-row">
                      <span>GST (18%):</span>
                      <span className="price">₹{(totalPrice * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="price-row total">
                      <span>Total:</span>
                      <span className="price">₹{(totalPrice * 1.18).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddToCart}
                  disabled={!isAvailable || product.quantityOnHand === 0 || !startDate || !endDate}
                  className="btn btn-primary btn-large"
                >
                  <FaShoppingCart /> Add to Cart
                </button>
              </div>
            )}

            {/* Buy Configuration */}
            {mode === 'buy' && (
              <div className="rental-config">
                <h3>Purchase Details</h3>
                
                <div className="config-group">
                  <label>Quantity</label>
                  <div className="quantity-selector">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      min="1"
                      max={product.quantityOnHand}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="qty-input"
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(product.quantityOnHand, quantity + 1))}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                {totalPrice > 0 && (
                  <div className="price-summary">
                    <div className="price-row">
                      <span>Item Price:</span>
                      <span className="price">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="price-row">
                      <span>GST (18%):</span>
                      <span className="price">₹{(totalPrice * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="price-row total">
                      <span>Total:</span>
                      <span className="price">₹{(totalPrice * 1.18).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddToCart}
                  disabled={product.quantityOnHand === 0}
                  className="btn btn-primary btn-large"
                >
                  <FaShoppingCart /> Buy Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Section */}
        {product.specifications && (
          <div className="specifications-section">
            <h2>Specifications</h2>
            <div className="specs-grid">
              {product.specifications.brand && (
                <div className="spec-item">
                  <span className="spec-label">Brand:</span>
                  <span className="spec-value">{product.specifications.brand}</span>
                </div>
              )}
              {product.specifications.model && (
                <div className="spec-item">
                  <span className="spec-label">Model:</span>
                  <span className="spec-value">{product.specifications.model}</span>
                </div>
              )}
              {product.specifications.condition && (
                <div className="spec-item">
                  <span className="spec-label">Condition:</span>
                  <span className="spec-value">{product.specifications.condition}</span>
                </div>
              )}
              {product.specifications.weight && (
                <div className="spec-item">
                  <span className="spec-label">Weight:</span>
                  <span className="spec-value">{product.specifications.weight}</span>
                </div>
              )}
              {product.specifications.color && (
                <div className="spec-item">
                  <span className="spec-label">Color:</span>
                  <span className="spec-value">{product.specifications.color}</span>
                </div>
              )}
              {product.specifications.material && (
                <div className="spec-item">
                  <span className="spec-label">Material:</span>
                  <span className="spec-value">{product.specifications.material}</span>
                </div>
              )}
              {product.specifications.dimensions && (
                <>
                  {product.specifications.dimensions.length && (
                    <div className="spec-item">
                      <span className="spec-label">Dimensions:</span>
                      <span className="spec-value">
                        {product.specifications.dimensions.length} × {product.specifications.dimensions.width} × {product.specifications.dimensions.height}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {product.tags && product.tags.length > 0 && (
          <div className="tags-section">
            <h3>Tags</h3>
            <div className="tags-list">
              {product.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Info Section */}
        {product.vendor && (
          <div className="vendor-section">
            <h2>Rented By</h2>
            <div className="vendor-card">
              <div className="vendor-info">
                <h3>{product.vendor.companyName || product.vendor.name}</h3>
                <p>{product.vendor.email}</p>
                {product.vendor.gstin && <p>GSTIN: {product.vendor.gstin}</p>}
              </div>
              <button 
                onClick={() => navigate(`/products?vendor=${product.vendor._id}`)}
                className="btn btn-secondary"
              >
                View All Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;

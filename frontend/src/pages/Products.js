import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaSearch, FaHeart, FaRegHeart } from 'react-icons/fa';
import { productsAPI } from '../utils/api';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: ''
  });
  const [categories] = useState([
    'Electronics',
    'Furniture',
    'Entertainment',
    'Transportation',
    'Tools & Equipment',
    'Party Supplies'
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll(filters);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={i < Math.floor(rating) ? 'star filled' : 'star'}
        />
      );
    }
    return stars;
  };

  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.images[0];
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Browse Products</h1>
        <p className="page-subtitle">Find the perfect items for rent from our extensive collection</p>
      </div>

      {/* Search and Filters */}
      <div className="filters-section card">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name or description..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {categories.length > 0 && (
          <div className="category-filters">
            <button
              className={`category-btn ${filters.category === '' ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, category: '' })}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${filters.category === category ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, category })}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="products-count">
        <span>{products.length} products found</span>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product._id}
              className="product-card"
              onClick={() => navigate(`/products/${product._id}`)}
            >
              <div className="product-image">
                <img src={getPrimaryImage(product)} alt={product.name} />
                <button className="wishlist-icon-btn">
                  <FaRegHeart />
                </button>
              </div>
              <div className="product-info">
                <div className="product-category">{product.category}</div>
                <h3 className="product-name">{product.name}</h3>
                {product.specifications?.condition && (
                  <div className="product-condition">
                    Product Condition: <span className="condition-value">{product.specifications.condition}</span>
                  </div>
                )}

                <div className="product-pricing">
                  {product.availabilityType === 'sale' || product.availabilityType === 'both' ? (
                    <div className="price-info">
                      <span className="price-label">Sale Price</span>
                      <span className="price-value">
                        ₹{product.salesPrice || 0}
                      </span>
                    </div>
                  ) : null}
                  {product.availabilityType === 'rent' || product.availabilityType === 'both' ? (
                    <div className="price-info">
                      <span className="price-label">Rental from</span>
                      <span className="price-value">
                        ₹{product.rentalPricing?.daily || product.rentalPricing?.hourly || 0}
                        <span className="price-unit">/{product.rentalPricing?.daily ? 'day' : 'hr'}</span>
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="product-actions">
                  {(product.availabilityType === 'sale' || product.availabilityType === 'both') && (
                    <button
                      className="btn btn-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${product._id}?action=buy`);
                      }}
                    >
                      <FaShoppingCart /> Buy Now
                    </button>
                  )}
                  {(product.availabilityType === 'rent' || product.availabilityType === 'both') && (
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${product._id}?action=rent`);
                      }}
                    >
                      <FaShoppingCart /> Rent Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Products;

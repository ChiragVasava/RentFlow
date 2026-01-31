import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaBox, FaSave, FaTimes, 
  FaCog, FaInfoCircle 
} from 'react-icons/fa';
import { productsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './ManageProducts.css';

const ManageProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    productType: 'goods',
    description: '',
    quantityOnHand: 0,
    salesPrice: 0,
    costPrice: 0,
    category: '',
    rentalPricing: {
      hourly: 0,
      daily: 0,
      weekly: 0
    },
    specifications: {
      brand: '',
      model: '',
      condition: 'good',
      color: '',
      material: ''
    },
    images: []
  });

  const [attributes, setAttributes] = useState([
    { id: 1, name: '', values: '' }
  ]);

  const [imageUrls, setImageUrls] = useState(['']);

  const categories = [
    'Electronics',
    'Furniture',
    'Construction Equipment',
    'Audio/Video',
    'Computers',
    'Office Equipment',
    'Photography',
    'Party & Events',
    'Sports Equipment',
    'Tools & Machinery',
    'Other'
  ];

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      console.log('Fetched products response:', response.data);
      // Backend already filters vendor products when vendor is logged in
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrl = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { id: Date.now(), name: '', values: '' }]);
  };

  const handleAttributeChange = (id, field, value) => {
    setAttributes(attributes.map(attr =>
      attr.id === id ? { ...attr, [field]: value } : attr
    ));
  };

  const handleRemoveAttribute = (id) => {
    setAttributes(attributes.filter(attr => attr.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.category) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Prepare product data
      const productData = {
        ...formData,
        vendor: user.id,
        isRentable: formData.productType === 'goods',
        attributes: attributes
          .filter(attr => attr.name && attr.values)
          .map(attr => ({
            name: attr.name,
            value: attr.values
          }))
      };

      // Handle image URLs (filter out empty URLs)
      const validImageUrls = imageUrls.filter(url => url.trim() !== '');
      if (validImageUrls.length > 0) {
        productData.images = validImageUrls.map((url, index) => ({
          url: url,
          isPrimary: index === 0,
          caption: ''
        }));
      } else {
        // Use a placeholder image if no images provided
        productData.images = [{
          url: 'https://via.placeholder.com/400x400?text=No+Image',
          isPrimary: true
        }];
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, productData);
        toast.success('Product updated successfully');
      } else {
        const response = await productsAPI.create(productData);
        console.log('Product created:', response.data);
        toast.success('Product created successfully');
      }

      // Reset form and refresh list
      setShowNewProductForm(false);
      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      productType: 'goods',
      description: '',
      quantityOnHand: 0,
      salesPrice: 0,
      costPrice: 0,
      category: '',
      rentalPricing: {
        hourly: 0,
        daily: 0,
        weekly: 0
      },
      specifications: {
        brand: '',
        model: '',
        condition: 'good',
        color: '',
        material: ''
      },
      images: []
    });
    setAttributes([{ id: 1, name: '', values: '' }]);
    setImageUrls(['']);
    setEditingProduct(null);
    setActiveTab('general');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      productType: product.isRentable ? 'goods' : 'service',
      description: product.description || '',
      quantityOnHand: product.quantityOnHand || 0,
      salesPrice: product.salesPrice || 0,
      costPrice: product.costPrice || 0,
      category: product.category || '',
      rentalPricing: product.rentalPricing || { hourly: 0, daily: 0, weekly: 0 },
      specifications: product.specifications || {
        brand: '',
        model: '',
        condition: 'good',
        color: '',
        material: ''
      },
      images: product.images || []
    });

    if (product.attributes && product.attributes.length > 0) {
      setAttributes(product.attributes.map((attr, idx) => ({
        id: idx + 1,
        name: attr.name || '',
        values: attr.value || ''
      })));
    }

    if (product.images && product.images.length > 0) {
      setImageUrls(product.images.map(img => img.url || ''));
    } else {
      setImageUrls(['']);
    }

    setShowNewProductForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(productId);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.images[0];
    }
    return 'https://via.placeholder.com/100x100?text=No+Image';
  };

  if (loading && !showNewProductForm) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  if (showNewProductForm) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            {editingProduct ? 'Edit' : 'New'} Product
          </h1>
          <div className="header-actions">
            <button 
              className="btn btn-outline" 
              onClick={() => {
                resetForm();
                setShowNewProductForm(false);
              }}
            >
              <FaTimes /> Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              <FaSave /> {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>

        <div className="product-form-card card">
          {/* Tabs */}
          <div className="form-tabs">
            <button
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <FaInfoCircle /> General Information
            </button>
            <button
              className={`tab-btn ${activeTab === 'attributes' ? 'active' : ''}`}
              onClick={() => setActiveTab('attributes')}
            >
              <FaCog /> Attributes & Variants
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* General Information Tab */}
            {activeTab === 'general' && (
              <div className="tab-content">
                <div className="form-layout">
                  <div className="form-main">
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Product Type *</label>
                        <div className="radio-group">
                          <label className="radio-label">
                            <input
                              type="radio"
                              name="productType"
                              value="goods"
                              checked={formData.productType === 'goods'}
                              onChange={handleInputChange}
                            />
                            <span>Goods</span>
                          </label>
                          <label className="radio-label">
                            <input
                              type="radio"
                              name="productType"
                              value="service"
                              checked={formData.productType === 'service'}
                              onChange={handleInputChange}
                            />
                            <span>Service</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Quantity on Hand</label>
                        <input
                          type="number"
                          name="quantityOnHand"
                          value={formData.quantityOnHand}
                          onChange={handleInputChange}
                          min="0"
                          step="1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Category *</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Sales Price (₹) *</label>
                        <div className="input-with-suffix">
                          <span className="input-prefix">₹</span>
                          <input
                            type="number"
                            name="salesPrice"
                            value={formData.salesPrice}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            required
                          />
                          <span className="input-suffix">Per Unit</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Cost Price (₹) *</label>
                        <div className="input-with-suffix">
                          <span className="input-prefix">₹</span>
                          <input
                            type="number"
                            name="costPrice"
                            value={formData.costPrice}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            required
                          />
                          <span className="input-suffix">Per Unit</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Enter product description"
                      />
                    </div>

                    <div className="form-section">
                      <h3>Rental Pricing</h3>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Hourly Rate (₹)</label>
                          <input
                            type="number"
                            name="rentalPricing.hourly"
                            value={formData.rentalPricing.hourly}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="form-group">
                          <label>Daily Rate (₹)</label>
                          <input
                            type="number"
                            name="rentalPricing.daily"
                            value={formData.rentalPricing.daily}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="form-group">
                          <label>Weekly Rate (₹)</label>
                          <input
                            type="number"
                            name="rentalPricing.weekly"
                            value={formData.rentalPricing.weekly}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Specifications</h3>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Brand</label>
                          <input
                            type="text"
                            name="specifications.brand"
                            value={formData.specifications.brand}
                            onChange={handleInputChange}
                            placeholder="e.g., Sony, Dell, etc."
                          />
                        </div>

                        <div className="form-group">
                          <label>Model</label>
                          <input
                            type="text"
                            name="specifications.model"
                            value={formData.specifications.model}
                            onChange={handleInputChange}
                            placeholder="Model number"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Color</label>
                          <input
                            type="text"
                            name="specifications.color"
                            value={formData.specifications.color}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label>Material</label>
                          <input
                            type="text"
                            name="specifications.material"
                            value={formData.specifications.material}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label>Condition</label>
                          <select
                            name="specifications.condition"
                            value={formData.specifications.condition}
                            onChange={handleInputChange}
                          >
                            <option value="new">New</option>
                            <option value="like-new">Like New</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Vendor Name</label>
                      <input
                        type="text"
                        value={user?.companyName || user?.name || ''}
                        disabled
                        className="input-disabled"
                      />
                      <small className="form-hint">Auto-filled from your profile</small>
                    </div>
                  </div>

                  <div className="form-sidebar">
                    <div className="sidebar-section card">
                      <h3>Product Images</h3>
                      <div className="image-urls-section">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="image-url-row">
                            <div className="image-url-input-group">
                              <input
                                type="url"
                                value={url}
                                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                placeholder={`Image URL ${index + 1} ${index === 0 ? '(Primary)' : ''}`}
                                className="image-url-input"
                              />
                              {imageUrls.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-url"
                                  onClick={() => handleRemoveImageUrl(index)}
                                  title="Remove image"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                            {url && (
                              <div className="image-url-preview">
                                <img 
                                  src={url} 
                                  alt={`Preview ${index + 1}`}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/100x100?text=Invalid+URL';
                                  }}
                                />
                                {index === 0 && (
                                  <span className="primary-badge">Primary</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-outline btn-block btn-sm"
                          onClick={handleAddImageUrl}
                        >
                          <FaPlus /> Add Image URL
                        </button>
                        <small className="form-hint">
                          <FaInfoCircle /> Enter image URLs (first image will be primary). Use services like Imgur, Cloudinary, or direct image links.
                        </small>
                      </div>
                    </div>

                    <div className="sidebar-section card">
                      <h3>Publish Status</h3>
                      <p className="status-info">
                        <FaInfoCircle /> Only admin can publish products
                      </p>
                      <div className="status-badge">
                        {formData.isPublished ? (
                          <><FaEye /> Published</>
                        ) : (
                          <><FaEyeSlash /> Draft</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attributes & Variants Tab */}
            {activeTab === 'attributes' && (
              <div className="tab-content">
                <div className="attributes-section">
                  <div className="section-header">
                    <h3>Attributes</h3>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleAddAttribute}
                    >
                      <FaPlus /> Add Row
                    </button>
                  </div>

                  <div className="attributes-table">
                    <div className="table-header">
                      <div className="col-header">Attribute Name</div>
                      <div className="col-header">Values</div>
                      <div className="col-header">Actions</div>
                    </div>

                    {attributes.map((attr) => (
                      <div key={attr.id} className="table-row">
                        <div className="col-cell">
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)}
                            placeholder="e.g., Brand, Color, Size"
                          />
                        </div>
                        <div className="col-cell">
                          <input
                            type="text"
                            value={attr.values}
                            onChange={(e) => handleAttributeChange(attr.id, 'values', e.target.value)}
                            placeholder="e.g., Red, Green, Blue (comma separated)"
                          />
                        </div>
                        <div className="col-cell">
                          {attributes.length > 1 && (
                            <button
                              type="button"
                              className="btn-icon btn-danger"
                              onClick={() => handleRemoveAttribute(attr.id)}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="attributes-hint">
                    <FaInfoCircle /> Add attributes like Brand, Color, Size, etc. to describe product variants
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FaBox /> My Products
          </h1>
          <p className="page-subtitle">
            Manage your rental products
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewProductForm(true)}
        >
          <FaPlus /> New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state card">
          <FaBox className="empty-icon" />
          <h3>No Products Yet</h3>
          <p>Start by adding your first product</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewProductForm(true)}
          >
            <FaPlus /> Add Product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card card">
              <div className="product-image">
                <img src={getPrimaryImage(product)} alt={product.name} />
                <div className="product-status">
                  {product.isPublished ? (
                    <span className="status-badge published">
                      <FaEye /> Published
                    </span>
                  ) : (
                    <span className="status-badge draft">
                      <FaEyeSlash /> Draft
                    </span>
                  )}
                </div>
              </div>

              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
                
                <div className="product-details">
                  <div className="detail-row">
                    <span className="label">Stock:</span>
                    <span className="value">{product.quantityOnHand} units</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span className="value">₹{product.salesPrice?.toLocaleString()}</span>
                  </div>
                  {product.rentalPricing?.daily > 0 && (
                    <div className="detail-row">
                      <span className="label">Daily Rental:</span>
                      <span className="value">₹{product.rentalPricing.daily?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="product-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleEdit(product)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="btn btn-outline btn-sm btn-danger"
                  onClick={() => handleDelete(product._id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageProducts;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSave, FaTimes, FaUpload, FaTrash, FaPlus, FaCog, FaInfoCircle } from 'react-icons/fa';
import { productsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    name: '',
    productType: 'goods',
    description: '',
    quantityOnHand: 0,
    salesPrice: 0,
    salesPriceUnit: 'per unit',
    costPrice: 0,
    costPriceUnit: 'per unit',
    category: '',
    vendor: user?.id || '',
    vendorName: user?.companyName || user?.name || '',
    availabilityType: 'rent', // New field
    isRentable: true,
    isSellable: false,
    isPublished: false,
    images: [],
    rentalPricing: {
      hourly: 0,
      daily: 0,
      weekly: 0
    },
    specifications: {
      brand: '',
      model: '',
      condition: 'good',
      weight: '',
      color: '',
      material: ''
    }
  });

  const [attributes, setAttributes] = useState([
    { id: 1, name: '', values: [] }
  ]);

  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getOne(id);
      const product = response.data.product || response.data.data;
      
      setFormData({
        name: product.name || '',
        productType: product.isRentable ? 'goods' : 'service',
        description: product.description || '',
        quantityOnHand: product.quantityOnHand || 0,
        salesPrice: product.salesPrice || 0,
        salesPriceUnit: 'per unit',
        costPrice: product.costPrice || 0,
        costPriceUnit: 'per unit',
        category: product.category || '',
        vendor: product.vendor?._id || user?.id,
        vendorName: product.vendor?.companyName || user?.companyName || '',
        isPublished: product.isPublished || false,
        images: product.images || [],
        rentalPricing: product.rentalPricing || { hourly: 0, daily: 0, weekly: 0 },
        specifications: product.specifications || {
          brand: '',
          model: '',
          condition: 'good',
          weight: '',
          color: '',
          material: ''
        }
      });

      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary);
        setImagePreview(primaryImage?.url || product.images[0].url);
      }

      if (product.attributes && product.attributes.length > 0) {
        setAttributes(product.attributes.map((attr, idx) => ({
          id: idx + 1,
          name: attr.name || '',
          values: attr.value ? [attr.value] : []
        })));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
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

  const handleAvailabilityTypeChange = (e) => {
    const availabilityType = e.target.value;
    setFormData(prev => ({
      ...prev,
      availabilityType,
      isRentable: availabilityType === 'rent' || availabilityType === 'both',
      isSellable: availabilityType === 'sale' || availabilityType === 'both'
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // In real app, upload to server/cloud storage
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { id: attributes.length + 1, name: '', values: [] }]);
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
    
    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        isRentable: formData.productType === 'goods',
        vendor: formData.vendor || user?.id,
        attributes: attributes.filter(attr => attr.name).map(attr => ({
          name: attr.name,
          value: attr.values.join(', ')
        }))
      };

      if (id) {
        await productsAPI.update(id, productData);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(productData);
        toast.success('Product created successfully');
      }
      
      navigate('/vendor/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Electronics',
    'Event Equipment',
    'Outdoor & Sports',
    'Party Supplies',
    'Tools & Equipment',
    'Transportation',
    'Entertainment',
    'Furniture',
    'Professional Equipment'
  ];

  const priceUnits = ['per unit', 'per day', 'per hour', 'per week', 'per month'];

  if (loading && id) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <div className="container">
        {/* Header */}
        <div className="form-header">
          <div className="header-left">
            <span className="badge-purple">{id ? 'Edit Product' : 'New Product'}</span>
          </div>
          <div className="header-right">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              <FaTimes /> Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              <FaSave /> {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="info-note">
          <FaInfoCircle />
          <span>
            <strong>Note:</strong> If you want to add Deposit, Down Payment, or Warranty charges, 
            please create a separate Service-type product and add it manually to the invoice.
          </span>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit} className="product-form-grid">
          {/* LEFT PANEL - General Information */}
          <div className="left-panel">
            <div className="panel-card">
              <h2 className="panel-title">General Information</h2>

              {/* Image Upload */}
              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-container">
                  <div className="image-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product preview" />
                    ) : (
                      <div className="image-placeholder">
                        <FaUpload />
                        <span>Upload Image</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="image-upload"
                    className="hidden-input"
                  />
                  <label htmlFor="image-upload" className="btn btn-outline">
                    <FaUpload /> Choose Image
                  </label>
                </div>
              </div>

              {/* Product Name */}
              <div className="form-group">
                <label htmlFor="name">Product Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Product Type */}
              <div className="form-group">
                <label>Product Type <span className="required">*</span></label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="productType"
                      value="goods"
                      checked={formData.productType === 'goods'}
                      onChange={handleChange}
                    />
                    <span>Goods</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="productType"
                      value="service"
                      checked={formData.productType === 'service'}
                      onChange={handleChange}
                    />
                    <span>Service</span>
                  </label>
                </div>
              </div>

              {/* Availability Type */}
              <div className="form-group">
                <label>Availability Type <span className="required">*</span></label>
                <select
                  name="availabilityType"
                  value={formData.availabilityType}
                  onChange={handleAvailabilityTypeChange}
                  className="select-field"
                >
                  <option value="rent">For Rent Only</option>
                  <option value="sale">For Sale Only</option>
                  <option value="both">For Both Sale & Rent</option>
                </select>
                <small className="field-hint">
                  Choose whether this product is available for rent, sale, or both
                </small>
              </div>

              {/* Quantity on Hand */}
              <div className="form-group">
                <label htmlFor="quantityOnHand">Quantity on Hand</label>
                <input
                  type="number"
                  id="quantityOnHand"
                  name="quantityOnHand"
                  value={formData.quantityOnHand}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              {/* Sales Price - Only show if product is for sale */}
              {(formData.availabilityType === 'sale' || formData.availabilityType === 'both') && (
                <div className="form-group">
                  <label htmlFor="salesPrice">Sales Price <span className="required">*</span></label>
                  <div className="input-group">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      id="salesPrice"
                      name="salesPrice"
                      value={formData.salesPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                    <select
                      name="salesPriceUnit"
                      value={formData.salesPriceUnit}
                      onChange={handleChange}
                      className="input-suffix-select"
                    >
                      {priceUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Cost Price */}
              <div className="form-group">
                <label htmlFor="costPrice">Cost Price</label>
                <div className="input-group">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <select
                    name="costPriceUnit"
                    value={formData.costPriceUnit}
                    onChange={handleChange}
                    className="input-suffix-select"
                  >
                    {priceUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rental Pricing - Only show if product is for rent */}
              {(formData.availabilityType === 'rent' || formData.availabilityType === 'both') && (
                <div className="form-group">
                  <label>Rental Pricing (Optional)</label>
                  <div className="rental-pricing-grid">
                  <div className="price-input-small">
                    <label>Hourly</label>
                    <div className="input-group-small">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        name="rentalPricing.hourly"
                        value={formData.rentalPricing.hourly}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="price-input-small">
                    <label>Daily</label>
                    <div className="input-group-small">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        name="rentalPricing.daily"
                        value={formData.rentalPricing.daily}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="price-input-small">
                    <label>Weekly</label>
                    <div className="input-group-small">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        name="rentalPricing.weekly"
                        value={formData.rentalPricing.weekly}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Category */}
              <div className="form-group">
                <label htmlFor="category">Category <span className="required">*</span></label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Vendor Name */}
              <div className="form-group">
                <label htmlFor="vendorName">Vendor Name</label>
                <input
                  type="text"
                  id="vendorName"
                  name="vendorName"
                  value={formData.vendorName}
                  readOnly
                  className="readonly-input"
                />
                <small className="help-text">Auto-filled based on logged-in vendor</small>
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter product description"
                />
              </div>

              {/* Publish Toggle */}
              <div className="form-group">
                <div className="toggle-group">
                  <label className="toggle-label">
                    <span>Publish Product</span>
                    <div className="toggle-switch-wrapper">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleChange}
                        disabled={user?.role !== 'admin'}
                        className="toggle-checkbox"
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                  {user?.role !== 'admin' && (
                    <small className="help-text">
                      <FaInfoCircle /> Only Admin can publish or unpublish products
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Attributes & Variants */}
          <div className="right-panel">
            <div className="panel-card">
              {/* Tabs */}
              <div className="tabs">
                <button
                  type="button"
                  className={`tab ${activeTab === 'general' ? 'active' : ''}`}
                  onClick={() => setActiveTab('general')}
                >
                  General Information
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'attributes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attributes')}
                >
                  Attributes & Variants
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'general' && (
                <div className="tab-content">
                  <h3>Specifications</h3>
                  
                  <div className="form-group">
                    <label htmlFor="brand">Brand</label>
                    <input
                      type="text"
                      id="brand"
                      name="specifications.brand"
                      value={formData.specifications.brand}
                      onChange={handleChange}
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <input
                      type="text"
                      id="model"
                      name="specifications.model"
                      value={formData.specifications.model}
                      onChange={handleChange}
                      placeholder="Enter model number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="condition">Condition</label>
                    <select
                      id="condition"
                      name="specifications.condition"
                      value={formData.specifications.condition}
                      onChange={handleChange}
                    >
                      <option value="new">New</option>
                      <option value="like-new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="weight">Weight</label>
                    <input
                      type="text"
                      id="weight"
                      name="specifications.weight"
                      value={formData.specifications.weight}
                      onChange={handleChange}
                      placeholder="e.g., 5kg"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color">Color</label>
                    <input
                      type="text"
                      id="color"
                      name="specifications.color"
                      value={formData.specifications.color}
                      onChange={handleChange}
                      placeholder="Enter color"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="material">Material</label>
                    <input
                      type="text"
                      id="material"
                      name="specifications.material"
                      value={formData.specifications.material}
                      onChange={handleChange}
                      placeholder="Enter material"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'attributes' && (
                <div className="tab-content">
                  <h3>Product Attributes</h3>
                  
                  <div className="attributes-table">
                    <div className="table-header">
                      <div className="th">Attribute Name</div>
                      <div className="th">Values</div>
                      <div className="th">Actions</div>
                    </div>
                    
                    {attributes.map((attr) => (
                      <div key={attr.id} className="table-row">
                        <div className="td">
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)}
                            placeholder="e.g., Brand, Size, Color"
                          />
                        </div>
                        <div className="td">
                          <input
                            type="text"
                            value={attr.values.join(', ')}
                            onChange={(e) => handleAttributeChange(attr.id, 'values', e.target.value.split(',').map(v => v.trim()))}
                            placeholder="Enter values separated by commas"
                          />
                        </div>
                        <div className="td actions">
                          <button
                            type="button"
                            className="btn-icon btn-danger"
                            onClick={() => handleRemoveAttribute(attr.id)}
                            title="Remove attribute"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={handleAddAttribute}
                  >
                    <FaPlus /> Add a line
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

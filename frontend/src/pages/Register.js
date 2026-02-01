import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    gstin: '',
    role: 'customer',
    couponCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    const validations = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    return validations;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    const newErrors = { ...validationErrors };

    if (name === 'email') {
      if (value && !isValidEmail(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'password') {
      const passwordValidation = validatePassword(value);
      if (value && !Object.values(passwordValidation).every(Boolean)) {
        newErrors.password = 'Password does not meet requirements';
      } else {
        delete newErrors.password;
      }
    }

    if (name === 'confirmPassword') {
      if (value && value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setValidationErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!Object.values(passwordValidation).every(Boolean)) {
      toast.error('Password must meet all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.role === 'vendor' && !formData.gstin) {
      toast.error('GSTIN is mandatory for vendors');
      return;
    }

    if (formData.role === 'vendor' && !formData.companyName) {
      toast.error('Company Name is mandatory for vendors');
      return;
    }

    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card wide">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join RentalHub today</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${validationErrors.email ? 'error' : formData.email && isValidEmail(formData.email) ? 'success' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {validationErrors.email && (
                  <div className="validation-error">
                    <FaTimes className="error-icon" />
                    {validationErrors.email}
                  </div>
                )}
                {formData.email && !validationErrors.email && isValidEmail(formData.email) && (
                  <div className="validation-success-simple">
                    Valid email address
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-control ${validationErrors.password ? 'error' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-requirements">
                    <div className="requirement-title">Password must contain:</div>
                    <div className={`requirement ${validatePassword(formData.password).minLength ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validatePassword(formData.password).minLength ? <FaCheck /> : <FaTimes />}
                      </span>
                      At least 8 characters
                    </div>
                    <div className={`requirement ${validatePassword(formData.password).hasUpperCase ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validatePassword(formData.password).hasUpperCase ? <FaCheck /> : <FaTimes />}
                      </span>
                      One uppercase letter
                    </div>
                    <div className={`requirement ${validatePassword(formData.password).hasLowerCase ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validatePassword(formData.password).hasLowerCase ? <FaCheck /> : <FaTimes />}
                      </span>
                      One lowercase letter
                    </div>
                    <div className={`requirement ${validatePassword(formData.password).hasNumber ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validatePassword(formData.password).hasNumber ? <FaCheck /> : <FaTimes />}
                      </span>
                      One number
                    </div>
                    <div className={`requirement ${validatePassword(formData.password).hasSymbol ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validatePassword(formData.password).hasSymbol ? <FaCheck /> : <FaTimes />}
                      </span>
                      One special character
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-control ${validationErrors.confirmPassword ? 'error' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'success' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <div className="validation-error">
                    <FaTimes className="error-icon" />
                    {validationErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {formData.role === 'vendor' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-control"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN *</label>
                  <input
                    type="text"
                    name="gstin"
                    className="form-control"
                    placeholder="Enter GSTIN (mandatory)"
                    value={formData.gstin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Register As *</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Coupon Code (Optional)</label>
                <input
                  type="text"
                  name="couponCode"
                  className="form-control"
                  placeholder="Enter coupon code"
                  value={formData.couponCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

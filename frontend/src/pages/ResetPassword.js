import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { authAPI } from '../utils/api';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

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

  useEffect(() => {
    // Verify token validity
    const verifyToken = async () => {
      try {
        await authAPI.verifyResetToken(token);
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
        toast.error('Invalid or expired reset token');
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    setLoading(true);

    try {
      await authAPI.resetPassword({
        token,
        password: formData.password
      });
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="error-message">
              <FaTimes className="error-icon-large" />
              <h2 className="auth-title">Invalid Reset Link</h2>
              <p className="auth-subtitle">
                This password reset link is invalid or has expired.
              </p>
              <div className="form-footer">
                <Link to="/forgot-password" className="btn btn-primary">
                  Request New Reset Link
                </Link>
                <Link to="/login" className="auth-link">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="loading-message">
              <p>Verifying reset token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  required
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
              <label className="form-label">Confirm New Password *</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`form-control ${formData.confirmPassword && formData.confirmPassword !== formData.password ? 'error' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'success' : ''}`}
                  placeholder="Confirm new password"
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
              {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                <div className="validation-error">
                  <FaTimes className="error-icon" />
                  Passwords do not match
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !Object.values(validatePassword(formData.password)).every(Boolean) || formData.password !== formData.confirmPassword}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { authAPI } from '../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      setEmailSent(true);
      
      // Show reset URL in development mode
      if (response.data.resetUrl) {
        console.log('Development Reset URL:', response.data.resetUrl);
        toast.success('Password reset link generated! Check browser console for the link.');
      } else {
        toast.success('Password reset email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="success-message">
              <FaEnvelope className="success-icon-large" />
              <h2 className="auth-title">Email Sent!</h2>
              <p className="auth-subtitle">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-small">
                Please check your email inbox (and spam folder) for the reset link.
                The link will expire in 1 hour.
              </p>
              <div className="form-footer">
                <Link to="/login" className="btn btn-primary">
                  <FaArrowLeft className="btn-icon" />
                  Back to Login
                </Link>
              </div>
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
          <h2 className="auth-title">Forgot Password?</h2>
          <p className="auth-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {email && !isValidEmail(email) && (
                <div className="validation-error">
                  Please enter a valid email address
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !isValidEmail(email)}
            >
              {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              <FaArrowLeft className="link-icon" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
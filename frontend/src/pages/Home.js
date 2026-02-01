import React from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaFileInvoice, FaShieldAlt, FaChartLine } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Rent Anything, Anytime</h1>
          <p className="hero-subtitle">
            Your complete rental management solution. List products, manage orders, 
            track inventory, and grow your rental business.
          </p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary btn-large" id="aakash">
              Browse Products
            </Link>
            <Link to="/register" className="btn btn-outline btn-large">
              Start Renting
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose RentalHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon primary">
                <FaBox />
              </div>
              <h3>Product Management</h3>
              <p>Easily manage your rental inventory with real-time availability tracking and automated reservations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon success">
                <FaFileInvoice />
              </div>
              <h3>Automated Invoicing</h3>
              <p>Generate professional invoices automatically with tax calculations and payment tracking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon warning">
                <FaShieldAlt />
              </div>
              <h3>Secure Transactions</h3>
              <p>Protected payment processing with security deposits and damage fee management.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon danger">
                <FaChartLine />
              </div>
              <h3>Business Analytics</h3>
              <p>Comprehensive dashboards and reports to track your rental business performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Browse & Select</h3>
              <p>Find the perfect product from our wide range of rentable items.</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Create Quotation</h3>
              <p>Add items to cart and get an instant quote with rental pricing.</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Confirm & Pay</h3>
              <p>Review your order, make payment, and receive confirmation.</p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Pickup & Return</h3>
              <p>Collect your items, use them, and return on scheduled date.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Your Rental Business?</h2>
          <p>Join thousands of vendors already using RentalHub to manage their rental operations.</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

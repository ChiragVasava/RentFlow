import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated ? "/products" : "/"} className="navbar-logo">
          <span className="logo-text">Rent</span>
          <span className="logo-accent">Flow</span>
        </Link>

        <ul className="navbar-menu">
          {!isAuthenticated && (
            <li><Link to="/" className="navbar-link">Home</Link></li>
          )}
          
          {isAuthenticated ? (
            <>
              <li><Link to="/products" className="navbar-link">Shop</Link></li>
              
              {user?.role === 'customer' && (
                <>
                  <li><Link to="/dashboard" className="navbar-link">
                    <FaTachometerAlt /> Dashboard
                  </Link></li>
                  <li><Link to="/cart" className="navbar-link cart-link">
                    <FaShoppingCart />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                  </Link></li>
                </>
              )}
              
              {user?.role === 'vendor' && (
                <>
                  <li><Link to="/dashboard" className="navbar-link">
                    <FaTachometerAlt /> Dashboard
                  </Link></li>
                  <li><Link to="/vendor/products" className="navbar-link">My Products</Link></li>
                </>
              )}
              
              {user?.role === 'admin' && (
                <>
                  <li><Link to="/dashboard" className="navbar-link">
                    <FaTachometerAlt /> Dashboard
                  </Link></li>
                  <li><Link to="/admin/users" className="navbar-link">Users</Link></li>
                </>
              )}
              
              <li className="navbar-dropdown">
                <div className="profile-circle">
                  {getInitials(user?.name)}
                </div>
                <ul className="dropdown-menu">
                  <li><Link to="/profile" className="dropdown-item">Profile</Link></li>
                  <li><Link to="/orders" className="dropdown-item">My Orders</Link></li>
                  <li><Link to="/invoices" className="dropdown-item">Invoices</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item">
                      <FaSignOutAlt /> Logout
                    </button>
                  </li>
                </ul>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="navbar-link">Login</Link></li>
              <li><Link to="/register" className="btn btn-primary navbar-btn">Sign Up</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

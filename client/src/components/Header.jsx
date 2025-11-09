// client/src/components/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Header.css';

const Header = ({ account, connectWallet, logout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <motion.header
      className="app-header"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left: Logo */}
      <div className="header-left">
        <Link to="/" className="logo-link">
          <span className="logo-icon">🔗</span> DRM Platform
        </Link>
      </div>

      {/* Center: Navigation */}
      <nav className="header-center">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Home
        </Link>
        <Link
          to="/upload"
          className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
        >
          Upload
        </Link>
      </nav>

      {/* Right: Wallet */}
      <div className="header-right">
        {!account ? (
          <motion.button
            onClick={connectWallet}
            className="connect-wallet-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Connect Wallet
          </motion.button>
        ) : (
          <motion.div
            className="user-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="wallet-address">
              {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            </span>
            <motion.button
              onClick={logout}
              className="logout-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;

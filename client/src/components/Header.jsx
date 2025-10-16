import React from 'react';
import { Link } from 'react-router-dom'; // For navigating between pages
import './Header.css'; // We will create this file next

const Header = ({ account, connectWallet }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo-link">DRM Platform</Link>
      </div>
      <div className="header-center">
        {/* Search bar can be added here later */}
      </div>
      <div className="header-right">
        <Link to="/upload" className="nav-link">Upload</Link>
        {!account ? (
          <button onClick={connectWallet} className="primary-action">Connect Wallet</button>
        ) : (
          <div className="user-info">
            {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
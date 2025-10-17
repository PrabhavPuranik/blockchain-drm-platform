import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import all Components and Pages
import Header from './components/Header';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import ContentDetailPage from './pages/ContentDetailPage';
// We are skipping Milestone 9 for now, so no PlayerPage import

function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it.");
    }
  };

  const logout = () => {
    setAccount(null);
  };

  // This useEffect hook handles all wallet connection events
  useEffect(() => {
    if (!window.ethereum) return;

    // Function to handle when the user changes accounts in MetaMask
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null); // User disconnected all accounts
      }
    };

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Initial check for an already connected account
    const checkInitialConnection = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
    };
    checkInitialConnection();

    // Cleanup: remove the listener when the app unmounts
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Header account={account} connectWallet={connectWallet} logout={logout} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route
              path="/content/:id"
              element={<ContentDetailPage account={account} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
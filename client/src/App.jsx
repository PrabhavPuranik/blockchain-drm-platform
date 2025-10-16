import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import Components and Pages
import Header from './components/Header';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';

function App() {
  const [account, setAccount] = useState(null);

  // Function to check if a wallet is already connected
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          console.log("Found an authorized account:", accounts[0]);
        } else {
          console.log("No authorized account found");
        }
      } catch (error) {
        console.error("Error checking for wallet connection:", error);
      }
    }
  };

  // Function to connect the wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        console.log("Wallet connected:", accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet.");
      }
    } else {
      alert("MetaMask is not installed. Please install it.");
    }
  };

  // Use useEffect to run the connection check once when the app loads
  useEffect(() => {
    checkWalletConnection();
  }, []);


  return (
    <Router>
      <div className="App">
        {/* The Header is always visible and receives account info and the connect function */}
        <Header account={account} connectWallet={connectWallet} />

        <main>
          {/* The Routes component will only render the Route that matches the current URL */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            {/* We will add more routes for content details later */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
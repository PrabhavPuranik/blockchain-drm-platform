import React, { useState } from 'react';
import { ethers } from 'ethers';

function App() {
  // This is a React "state" variable. It holds data that can change over time.
  // When it changes, the component will automatically re-render to show the new data.
  // Here, 'account' will store the user's wallet address. It starts as null.
  const [account, setAccount] = useState(null);

  // This is an asynchronous function to handle the wallet connection logic.
  const connectWallet = async () => {
    // Check if MetaMask is installed in the browser.
    // MetaMask injects an 'ethereum' object into the window.
    if (window.ethereum) {
      try {
        // Request account access from the user.
        // This will open the MetaMask pop-up.
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // The request returns an array of accounts. We take the first one.
        const userAccount = accounts[0];
        setAccount(userAccount); // Update our state with the user's account address.

        console.log("Wallet connected:", userAccount);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    } else {
      // If window.ethereum is not found, MetaMask is not installed.
      alert("MetaMask is not installed. Please install it to use this DApp.");
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <header>
        <h1>Blockchain DRM Platform</h1>
        <nav>
          {/* This is called conditional rendering. */}
          {/* If 'account' is null (user not connected), show the "Connect Wallet" button. */}
          {!account ? (
            <button onClick={connectWallet}>Connect Wallet</button>
          ) : (
            // If 'account' has a value (user is connected), show their address.
            // We shorten the address for better display.
            <p>
              Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            </p>
          )}
        </nav>
      </header>

      <main style={{ marginTop: '40px' }}>
        <h2>Welcome to the Future of Content</h2>
        {/* We will add content cards here in a later milestone */}
      </main>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import placeholderImage from '../assets/placeholder.png';
import './ContentDetailPage.css';

const ContentDetailPage = ({ account }) => {
  const { id } = useParams(); // Get the 'id' from the URL (e.g., /content/1 -> id is "1")
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchContentDetails = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const item = await contract.contents(id);

        if (item.id === 0n) throw new Error("Content not found.");

        setContent({
          id: Number(item.id),
          title: item.title,
          creator: item.creator,
          owner: item.owner,
          price: item.price, // Keep price in Wei (BigInt) for the transaction
          isForSale: item.isForSale,
        });

        // Check if the currently connected user is the owner
        if (account && item.owner.toLowerCase() === account.toLowerCase()) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Failed to fetch content details:", error);
        setMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentDetails();
  }, [id, account]); // Re-run this effect if the ID or the connected account changes

  const handlePurchase = async () => {
    if (!content) return;
    setIsLoading(true);
    setMessage('Processing purchase... Please approve in MetaMask.');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // The most important part: call the payable function with the correct value
      const transaction = await contract.purchaseContent(id, {
        value: content.price
      });

      await transaction.wait(); // Wait for the transaction to be mined

      setMessage('Purchase successful! You are now the owner.');
      setIsOwner(true); // Update the UI to reflect ownership
    } catch (error) {
      console.error("Purchase failed:", error);
      setMessage(`Purchase failed. Reason: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !content) {
    return <div className="loading-container">Loading content details...</div>;
  }

  if (!content) {
    return <div className="error-container">Error: {message || "Content could not be loaded."}</div>;
  }

  return (
    <div className="detail-container">
      <img src={placeholderImage} alt={content.title} className="detail-image" />
      <div className="detail-info">
        <h1>{content.title}</h1>
        <p><strong>Creator:</strong> {content.creator}</p>
        <p><strong>Owner:</strong> {content.owner}</p>
        <div className="price-tag">{ethers.formatEther(content.price)} ETH</div>

        <div className="action-box">
          {isOwner ? (
            <button className="owned-button" disabled>You Own This</button>
          ) : (
            <button
              onClick={handlePurchase}
              className="primary-action buy-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Buy Now'}
            </button>
          )}
        </div>
        {message && <p className="feedback-message">{message}</p>}
      </div>
    </div>
  );
};

export default ContentDetailPage;
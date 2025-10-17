import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import VideoPreview from '../components/VideoPreview'; // Import the new preview component
import './ContentDetailPage.css';

const ContentDetailPage = ({ account }) => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchContentDetails = async () => {
      // Reset states for new content load
      setIsLoading(true);
      setContent(null);
      setIsOwner(false);

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const item = await contract.contents(id);

        if (item.id === 0n) throw new Error("Content not found.");

        const fetchedContent = {
          id: Number(item.id),
          title: item.title,
          creator: item.creator,
          owner: item.owner,
          price: item.price,
          isForSale: item.isForSale,
          filePath: item.encryptedKeyCID,
        };
        setContent(fetchedContent);

        // Determine ownership based on the currently connected account
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

    if (id) {
      fetchContentDetails();
    }
  }, [id, account]); // This effect re-runs when the content ID or the user's account changes

  const handlePurchase = async () => {
    if (!content) return;
    setIsLoading(true);
    setMessage('Processing purchase... Please approve in MetaMask.');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const transaction = await contract.purchaseContent(id, {
        value: content.price
      });

      await transaction.wait();

      setMessage('Purchase successful! You are now the owner.');
      setIsOwner(true); // This state change will trigger a re-render to show the full player

    } catch (error)
    {
      console.error("Purchase failed:", error);
      setMessage(`Purchase failed. Reason: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render the correct media element
  const renderMedia = () => {
    if (!content) return null;

    const fullMediaUrl = `http://localhost:8000${content.filePath}`;
    const extension = content.filePath.split('.').pop().toLowerCase();
    const isVideo = ['mp4', 'webm', 'mov'].includes(extension);

    if (isVideo) {
      // If it's a video, show the full player for the owner, otherwise the preview
      return isOwner ? (
        <video src={fullMediaUrl} className="detail-media" controls />
      ) : (
        <VideoPreview src={fullMediaUrl} />
      );
    } else {
      // For images, always show the full image
      return <img src={fullMediaUrl} alt={content.title} className="detail-media" />;
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading content details...</div>;
  }
  
  if (!content) {
    return <div className="error-container">Error: {message || "Content could not be loaded."}</div>;
  }

  return (
    <div className="detail-container">
      <div className="media-container-detail">
        {renderMedia()}
      </div>
      <div className="detail-info">
        <h1>{content.title}</h1>
        <p><strong>Creator:</strong> {content.creator}</p>
        <p><strong>Owner:</strong> {content.owner}</p>
        <div className="price-tag">{ethers.formatEther(content.price)} ETH</div>

        <div className="action-box">
          {isOwner ? (
            <a 
              href={`http://localhost:8000${content.filePath}`} 
              download 
              className="primary-action download-button"
            >
              Download File
            </a>
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
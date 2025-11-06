import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';

// Import watermark components
import WatermarkedImage from '../components/WatermarkedImage';
import WatermarkedVideo from '../components/WatermarkedVideo';

import './ContentDetailPage.css';

const ContentDetailPage = ({ account }) => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [message, setMessage] = useState('');

  // 🟢 Function to log access (for non-owners)
  const logViewAccess = async () => {
    try {
      await fetch('http://localhost:8000/api/log-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: id,
          viewerAddress: account,
        }),
      });
    } catch (err) {
      console.warn('Failed to log view:', err);
    }
  };

  useEffect(() => {
    const fetchContentDetails = async () => {
      setIsLoading(true);
      setContent(null);
      setIsOwner(false);
      setMessage('');

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const item = await contract.contents(id);

        if (item.id === 0n) throw new Error('Content not found.');

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

        // Determine ownership and optionally log access
        if (account && item.owner.toLowerCase() === account.toLowerCase()) {
          setIsOwner(true);
        } else {
          logViewAccess();
        }

      } catch (error) {
        console.error('Failed to fetch content details:', error);
        setMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchContentDetails();
  }, [id, account]);

  // 🟢 Purchase handler
  const handlePurchase = async () => {
    if (!content) return;
    setIsLoading(true);
    setMessage('Processing purchase... Please approve in MetaMask.');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const transaction = await contract.purchaseContent(id, {
        value: content.price,
      });

      await transaction.wait();

      setMessage('✅ Purchase successful! You are now the owner.');
      setIsOwner(true);
    } catch (error) {
      console.error('Purchase failed:', error);
      setMessage(`Purchase failed: ${error.reason || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Choose how to render media (image / video)
  const renderMedia = () => {
    if (!content) return null;

    // Decide which URL to use (stream for videos)
    const extension = content.filePath.split('.').pop().toLowerCase();
    const fileName = content.filePath.split('/').pop();
    const isVideo = ['mp4', 'webm', 'mov'].includes(extension);
    const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(extension);

    const fullMediaUrl = isVideo
      ? `http://localhost:8000/stream/${fileName}`
      : `http://localhost:8000${content.filePath}`;

    if (isVideo) {
      return isOwner ? (
        <video src={fullMediaUrl} className="detail-media" controls />
      ) : (
        <WatermarkedVideo src={fullMediaUrl} watermarkText={account || 'UnknownUser'} />
      );
    } else if (isImage) {
      return isOwner ? (
        <img src={fullMediaUrl} alt={content.title} className="detail-media" />
      ) : (
        <WatermarkedImage src={fullMediaUrl} watermarkText={account || 'UnknownUser'} />
      );
    } else {
      return <p>Unsupported media type.</p>;
    }
  };

  // 🟢 Loading / Error states
  if (isLoading) {
    return <div className="loading-container">Loading content details...</div>;
  }

  if (!content) {
    return <div className="error-container">Error: {message || 'Content could not be loaded.'}</div>;
  }

  // 🟢 Main render
  return (
    <div className="detail-container">
      <div className="media-container-detail">
        {renderMedia()}
        {!isOwner && (
          <p className="watermark-note">
            🔒 This content is protected by a personalized watermark linked to your wallet address.
          </p>
        )}
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

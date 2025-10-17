// client/src/pages/ContentDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // No need for Link here anymore, so removed
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import placeholderImage from '../assets/placeholder.png';
import './ContentDetailPage.css';

const ContentDetailPage = ({ account }) => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [message, setMessage] = useState('');
  
  // --- NEW: State to hold the specific media component (img or video) ---
  const [mediaComponent, setMediaComponent] = useState(null);

  useEffect(() => {
    const fetchContentDetails = async () => {
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
          filePath: item.encryptedKeyCID, // Contains /uploads/filename.ext
        };
        setContent(fetchedContent);

        const fullMediaUrl = `http://localhost:8000${fetchedContent.filePath}`;
        const extension = fetchedContent.filePath.split('.').pop().toLowerCase();
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
        const videoExtensions = ['mp4', 'webm', 'mov'];

        // --- NEW: Dynamically set the media component for the detail page ---
        if (imageExtensions.includes(extension)) {
          setMediaComponent(<img src={fullMediaUrl} alt={fetchedContent.title} className="detail-media" />);
        } else if (videoExtensions.includes(extension)) {
          setMediaComponent(
            <video 
              src={fullMediaUrl} 
              alt={fetchedContent.title} 
              className="detail-media video-player" 
              controls={isOwner} // Only show controls if user is the owner
              autoPlay={false} // Don't autoplay on load
              muted={false}
              loop={false}
              preload="metadata"
            />
          );
        } else {
          setMediaComponent(<img src={placeholderImage} alt="Placeholder" className="detail-media" />);
        }

        if (account && item.owner.toLowerCase() === account.toLowerCase()) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (error) {
        console.error("Failed to fetch content details:", error);
        setMessage(error.message);
        setMediaComponent(<img src={placeholderImage} alt="Placeholder" className="detail-media" />); // Show placeholder on error
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchContentDetails();
    }
  }, [id, account, isOwner]); // Added isOwner to dependencies to update video controls

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
      setIsOwner(true); // Update UI to reflect ownership
      // --- NEW: Re-evaluate media component to show video controls if it's a video
      if (mediaComponent && mediaComponent.type === 'video') {
         setMediaComponent(
            <video 
              src={`http://localhost:8000${content.filePath}`} 
              alt={content.title} 
              className="detail-media video-player" 
              controls={true} // Now show controls
              autoPlay={false} 
              muted={false}
              loop={false}
              preload="metadata"
            />
         );
      }
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
      {/* --- CHANGE: Render the mediaComponent here --- */}
      {mediaComponent}
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
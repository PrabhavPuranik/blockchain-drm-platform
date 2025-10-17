// client/src/components/ContentCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './ContentCard.css';
import placeholderImage from '../assets/placeholder.png'; // Still used for non-video/non-image fallback

const ContentCard = ({ content }) => {
  const shortenAddress = (address) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  let mediaElement = null;
  const filePath = content.thumbnailPath; // This contains "/uploads/filename.ext"

  if (filePath) {
    const fullMediaUrl = `http://localhost:8000${filePath}`;
    const extension = filePath.split('.').pop().toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    const videoExtensions = ['mp4', 'webm', 'mov'];

    if (imageExtensions.includes(extension)) {
      mediaElement = <img src={fullMediaUrl} alt={content.title} className="card-thumbnail" />;
    } else if (videoExtensions.includes(extension)) {
      // --- NEW: Render a <video> element for video previews ---
      mediaElement = (
        <div className="video-thumbnail-container">
          <video
            src={fullMediaUrl}
            className="card-thumbnail video-preview"
            autoPlay
            muted
            loop
            playsInline // Important for mobile devices to play inline
            preload="metadata" // Load metadata to show first frame quickly
          />
          <div className="play-icon-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M8 5v14l11-7z"></path></svg>
          </div>
        </div>
      );
    } else {
      // Fallback for unsupported types
      mediaElement = <img src={placeholderImage} alt={content.title} className="card-thumbnail" />;
    }
  } else {
    // Fallback if no file path exists
    mediaElement = <img src={placeholderImage} alt={content.title} className="card-thumbnail" />;
  }

  return (
    <div className="content-card">
      {/* --- CHANGE: Directly render the determined mediaElement --- */}
      <div className="card-thumbnail-wrapper">
        {mediaElement}
      </div>
      <div className="card-body">
        <h3 className="card-title">{content.title}</h3>
        <p className="card-owner">
          Owner: {shortenAddress(content.owner)}
        </p>
        <div className="card-footer">
          <span className="card-price">{content.price} ETH</span>
          <Link to={`/content/${content.id}`}>
            <button className="card-button primary-action">View / Buy</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
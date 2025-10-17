import React from 'react';
import { Link } from 'react-router-dom';
import './ContentCard.css';
import placeholderImage from '../assets/placeholder.png';
import VideoPreview from './VideoPreview'; // Import our new limited preview component

const ContentCard = ({ content }) => {
  const shortenAddress = (address) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  let mediaElement = null;
  const filePath = content.thumbnailPath;

  if (filePath) {
    const fullMediaUrl = `http://localhost:8000${filePath}`;
    const extension = filePath.split('.').pop().toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    const videoExtensions = ['mp4', 'webm', 'mov'];

    if (imageExtensions.includes(extension)) {
      // For images, render a standard image tag
      mediaElement = <img src={fullMediaUrl} alt={content.title} className="card-thumbnail" />;
    } else if (videoExtensions.includes(extension)) {
      // For videos, render our smart VideoPreview component
      mediaElement = <VideoPreview src={fullMediaUrl} />;
    } else {
      // Fallback for other file types
      mediaElement = <img src={placeholderImage} alt={content.title} className="card-thumbnail" />;
    }
  } else {
    // Fallback if there is no file path
    mediaElement = <img src={placeholderImage} alt={content.title} className="card-thumbnail" />;
  }

  return (
    <div className="content-card">
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
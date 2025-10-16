import React from 'react';
import './ContentCard.css';

// Import the local placeholder image from the assets folder
import placeholderImage from '../assets/placeholder.png';

const ContentCard = ({ content }) => {
  const shortenAddress = (address) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="content-card">
      {/* Use the imported local image variable as the source */}
      <img src={placeholderImage} alt={content.title} className="card-thumbnail" />
      <div className="card-body">
        <h3 className="card-title">{content.title}</h3>
        <p className="card-owner">
          Owner: {shortenAddress(content.owner)}
        </p>
        <div className="card-footer">
          <span className="card-price">{content.price} ETH</span>
          <button className="card-button primary-action">View / Buy</button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ContentCard.css';
import placeholderImage from '../assets/placeholder.png';
import VideoPreview from './VideoPreview';

const ContentCard = ({ content }) => {
  const shortenAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  let mediaElement;
  const filePath = content.thumbnailPath;

  if (filePath) {
    const fullMediaUrl = `http://localhost:8000${filePath}`;
    const extension = filePath.split('.').pop().toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    const videoExtensions = ['mp4', 'webm', 'mov'];

    if (imageExtensions.includes(extension)) {
      mediaElement = <img src={fullMediaUrl} alt={content.title} className="card-thumbnail" />;
    } else if (videoExtensions.includes(extension)) {
      mediaElement = <VideoPreview src={fullMediaUrl} />;
    } else {
      mediaElement = <img src={placeholderImage} alt={content.title} className="card-thumbnail" />;
    }
  } else {
    mediaElement = <img src={placeholderImage} alt={content.title} className="card-thumbnail" />;
  }

  return (
    <motion.div
      className="content-card"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="card-thumbnail-wrapper">
        {mediaElement}
        <div className="drm-badge">🔒 DRM Protected</div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{content.title}</h3>
        <p className="card-owner">Owner: {shortenAddress(content.owner)}</p>

        <div className="card-footer">
          <span className="card-price">{content.price} ETH</span>
          <Link to={`/content/${content.id}`}>
            <motion.button
              className="card-button primary-action"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View / Buy
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;

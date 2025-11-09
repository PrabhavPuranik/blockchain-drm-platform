import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import './PlayerPage.css';

const PlayerPage = ({ account }) => {
  const { id } = useParams();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getMedia = async () => {
      if (!account) {
        setError("Please connect your wallet to view content.");
        setIsLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const content = await contract.contents(id);
        const filePath = content.encryptedKeyCID;

        if (!filePath) throw new Error("File path not found in contract.");

        const extension = filePath.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
          setMediaType('image');
        } else if (['mp4', 'webm', 'mov'].includes(extension)) {
          setMediaType('video');
        } else {
          throw new Error("Unsupported file type.");
        }

        const secureUrl = `http://localhost:8000/api/access/${id}?userAddress=${account}`;
        setMediaUrl(secureUrl);
      } catch (err) {
        console.error("Failed to get media:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getMedia();
  }, [id, account]);

  const handleContextMenu = (e) => e.preventDefault();

  if (isLoading)
    return <div className="loading-container">🎥 Verifying ownership...</div>;

  if (error)
    return <div className="error-container">❌ {error}</div>;

  return (
    <motion.div
      className="player-container"
      onContextMenu={handleContextMenu}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="media-wrapper"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {mediaType === 'video' && (
          <video
            src={mediaUrl}
            controls
            controlsList="nodownload"
            autoPlay
            className="video-player"
          />
        )}
        {mediaType === 'image' && (
          <img src={mediaUrl} alt="Purchased Content" className="image-player" />
        )}

        {/* Elegant Floating Watermark */}
        <div className="watermark">
          <p>Wallet: {account ? `${account.substring(0, 10)}...` : 'N/A'}</p>
          <p>{new Date().toLocaleString()}</p>
        </div>

        {/* Subtle Neon Edge Glow */}
        <div className="neon-frame"></div>
      </motion.div>
    </motion.div>
  );
};

export default PlayerPage;

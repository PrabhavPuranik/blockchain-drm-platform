// client/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import './HomePage.css';

const HomePage = () => {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(Date.now());

  // Refresh on focus (after upload)
  useEffect(() => {
    const handleFocus = () => setReloadKey(Date.now());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fetch content from contract
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        if (!window.ethereum) throw new Error('MetaMask is not installed.');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const contentCount = await contract.getContentCount();

        const count = Number(contentCount);
        const fetchedContent = [];

        for (let i = 1; i <= count; i++) {
          const content = await contract.contents(i);
          if (content.id !== 0n) {
            const fileName = content.encryptedKeyCID.split('/').pop();
            const extension = fileName.split('.').pop().toLowerCase();
            const isVideo = ['mp4', 'webm', 'mov'].includes(extension);
            const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(extension);

            const cacheBuster = `?t=${Date.now()}`;
            const mediaUrl = isVideo
              ? `http://localhost:8000/stream/${fileName}${cacheBuster}`
              : `http://localhost:8000${content.encryptedKeyCID}${cacheBuster}`;

            fetchedContent.push({
              id: Number(content.id),
              title: content.title,
              owner: content.owner,
              price: ethers.formatEther(content.price),
              isForSale: content.isForSale,
              mediaUrl,
              isVideo,
              isImage,
            });
          }
        }

        fetchedContent.sort((a, b) => b.id - a.id);
        setContentList(fetchedContent);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [reloadKey]);

  return (
    <main className="homepage-container">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Discover DRM-Protected Content
      </motion.h1>

      {isLoading ? (
        <motion.div
          className="loading-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading content from the blockchain...
        </motion.div>
      ) : contentList.length > 0 ? (
        <motion.div
          className="content-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {contentList.map((content) => (
            <motion.div
              key={`${content.id}-${reloadKey}`}
              className="content-card"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="media-preview">
                {content.isVideo ? (
                  <video
                    src={content.mediaUrl}
                    muted
                    loop
                    playsInline
                    className="thumbnail-video"
                    onMouseOver={(e) => e.target.play()}
                    onMouseOut={(e) => e.target.pause()}
                  />
                ) : (
                  <img
                    src={content.mediaUrl}
                    alt={content.title}
                    className="thumbnail-image"
                    loading="lazy"
                  />
                )}
                <span className="drm-badge">🔒 DRM Protected</span>
              </div>

              <div className="content-info">
                <h2>{content.title}</h2>
                <p className="price">{content.price} ETH</p>
                <a href={`/content/${content.id}`} className="view-details">
                  View Details →
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <p className="no-content-message">No content has been registered yet. Be the first!</p>
      )}
    </main>
  );
};

export default HomePage;

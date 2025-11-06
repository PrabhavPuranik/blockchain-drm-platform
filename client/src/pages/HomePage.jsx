import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import ContentCard from '../components/ContentCard';
import './HomePage.css';

const HomePage = () => {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(Date.now()); // 🟢 forces component refresh

  // 🟢 Listen for navigation back from UploadPage (window refocus)
  useEffect(() => {
    const handleFocus = () => setReloadKey(Date.now());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    // 🟢 Check if UploadPage requested a homepage refresh
    if (sessionStorage.getItem('drm_refresh')) {
      sessionStorage.removeItem('drm_refresh');
      setReloadKey(Date.now()); // Force immediate reload
    }

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

            // 🟢 Add cache-busting timestamp so browser shows fresh media
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

        // Sort newest first
        fetchedContent.sort((a, b) => b.id - a.id);
        setContentList(fetchedContent);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [reloadKey]); // 🟢 Refetch whenever reloadKey changes

  if (isLoading) {
    return <div className="loading-container">Loading content from the blockchain...</div>;
  }

  return (
    <main className="homepage-container">
      <h1>Discover DRM-Protected Content</h1>

      {contentList.length > 0 ? (
        <div className="content-grid">
          {contentList.map((content) => (
            <div key={`${content.id}-${reloadKey}`} className="content-card">
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
            </div>
          ))}
        </div>
      ) : (
        <p className="no-content-message">No content has been registered yet. Be the first!</p>
      )}
    </main>
  );
};

export default HomePage;

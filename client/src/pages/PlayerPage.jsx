import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import './PlayerPage.css';

const PlayerPage = ({ account }) => {
  const { id } = useParams();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
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
        // First, we need to get the file path from the contract
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const content = await contract.contents(id);
        const filePath = content.encryptedKeyCID;

        if (!filePath) {
          throw new Error("File path not found in contract.");
        }

        // Determine if the file is an image or video based on its extension
        const extension = filePath.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
          setMediaType('image');
        } else if (['mp4', 'webm', 'mov'].includes(extension)) {
          setMediaType('video');
        } else {
          throw new Error("Unsupported file type.");
        }

        // Construct the secure URL to our backend's protected route
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

  // Prevent the default right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  if (isLoading) return <div className="loading-container">Verifying ownership...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="player-container" onContextMenu={handleContextMenu}>
      {mediaUrl && (
        <div className="media-wrapper">
          {mediaType === 'video' && (
            <video src={mediaUrl} controls controlsList="nodownload" />
          )}
          {mediaType === 'image' && (
            <img src={mediaUrl} alt="Purchased Content" />
          )}

          {/* Dynamic Watermark Overlay */}
          <div className="watermark">
            <p>Owner: {account.substring(0, 10)}...</p>
            <p>{new Date().toUTCString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
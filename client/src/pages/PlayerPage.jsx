import React, { useState, useEffect, useRef } from 'react';
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

  // 🛑 Blackout state (activated on screenshot attempt)
  const [forceBlackout, setForceBlackout] = useState(false);
  const videoRef = useRef(null);

  /* ------------------------------------------------------------
     FETCH MEDIA
  ------------------------------------------------------------ */
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

        const ext = filePath.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
          setMediaType('image');
        } else if (['mp4', 'webm', 'mov'].includes(ext)) {
          setMediaType('video');
        } else {
          throw new Error("Unsupported file type.");
        }

        const secureUrl = `http://localhost:8000/api/access/${id}?userAddress=${account}`;
        setMediaUrl(secureUrl);
      } catch (err) {
        console.error("Failed to load media:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getMedia();
  }, [id, account]);

  /* ------------------------------------------------------------
     SCREENSHOT DETECTION
  ------------------------------------------------------------ */
  useEffect(() => {
    // Trigger blackout overlay
    const triggerBlackout = () => {
      console.log("⚠ Screenshot attempt detected!");
      setForceBlackout(true);
    };

    // Snipping Tool & Screenshots → tab goes hidden immediately
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        triggerBlackout();
      }
    };

    // Many screen capture tools cause blur event
    const handleBlur = () => {
      triggerBlackout();
    };

    // Pixel sampling detection (catches screen recording)
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(video, 0, 0, 32, 32);

        // If screenshot/recording, the pixels become flattened or blacked
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        const [r, g, b] = pixel;

        if (r === 0 && g === 0 && b === 0) {
          triggerBlackout();
        }
      } catch (error) {
        // If drawImage fails → recording tool detected
        triggerBlackout();
      }
    }, 1200);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  /* ------------------------------------------------------------
     UI RENDER
  ------------------------------------------------------------ */

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
        {/* MAIN MEDIA (still loads but is visually blacked out if forceBlackout = true) */}
        {mediaType === 'video' && (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            controlsList="nodownload"
            autoPlay
            className={`video-player ${forceBlackout ? "blackout" : ""}`}
          />
        )}
        {mediaType === 'image' && (
          <img
            src={mediaUrl}
            alt="Purchased Content"
            className={`image-player ${forceBlackout ? "blackout" : ""}`}
          />
        )}

        {/* Floating watermark */}
        {!forceBlackout && (
          <div className="watermark">
            <p>Wallet: {account ? `${account.substring(0, 10)}...` : 'N/A'}</p>
            <p>{new Date().toLocaleString()}</p>
          </div>
        )}

        {/* Blackout Overlay if screenshot detected */}
        {forceBlackout && (
          <div className="screenshot-blackout">
            <p>⚠ Screenshot attempt detected — content hidden for security.</p>
          </div>
        )}

        {/* Neon Frame */}
        <div className="neon-frame"></div>
      </motion.div>
    </motion.div>
  );
};

export default PlayerPage;

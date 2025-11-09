import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VideoPreview.css';

const PREVIEW_DURATION_SECONDS = 5;

const VideoPreview = ({ src }) => {
  const videoRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= PREVIEW_DURATION_SECONDS) {
      videoRef.current.pause();
      setShowOverlay(true);
      setIsPlaying(false);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
      setShowOverlay(false);
      setIsPlaying(false);
    }
  };

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      className="video-preview-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 150, damping: 12 }}
    >
      <video
        ref={videoRef}
        src={src}
        className="video-preview-element"
        muted
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
      />

      {/* DRM Overlay after preview ends */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p>🔒 Purchase to unlock full video</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static play icon with neon pulse */}
      {!isPlaying && (
        <motion.div
          className="play-icon-overlay-static"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="rgba(0,255,255,0.8)"
          >
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </motion.div>
      )}

      {/* Subtle neon border glow */}
      <motion.div
        className="glow-border"
        animate={{
          boxShadow: [
            '0 0 0px rgba(0,255,255,0)',
            '0 0 15px rgba(0,255,255,0.4)',
            '0 0 0px rgba(0,255,255,0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
};

export default VideoPreview;

import React, { useRef, useState } from 'react';
import './VideoPreview.css';

const PREVIEW_DURATION_SECONDS = 5;

const VideoPreview = ({ src }) => {
  const videoRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // This function is called continuously as the video plays
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= PREVIEW_DURATION_SECONDS) {
      videoRef.current.pause();
      setShowOverlay(true);
    }
  };

  // When the user's mouse leaves the video, reset it for the next time
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
      setShowOverlay(false);
    }
  };
  
  // When the user hovers over the video, start playing the preview
  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }

  return (
    <div 
      className="video-preview-wrapper" 
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <video
        ref={videoRef}
        src={src}
        className="video-preview-element"
        muted
        loop={false} // We don't want it to loop, we want it to stop
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
      />
      {showOverlay && (
        <div className="preview-overlay">
          <p>Purchase to watch the full video</p>
        </div>
      )}
      <div className="play-icon-overlay-static">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M8 5v14l11-7z"></path></svg>
      </div>
    </div>
  );
};

export default VideoPreview;
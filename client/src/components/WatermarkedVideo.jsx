import React, { useEffect, useRef, useState } from 'react';

const WatermarkedVideo = ({ src, watermarkText }) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = overlayRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');

    const drawWatermark = () => {
      if (!video.videoWidth) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fit watermark text nicely across width
      const baseFont = 'Arial';
      let fontSize = Math.floor(canvas.width / 16);
      ctx.font = `${fontSize}px ${baseFont}`;
      const maxAllowed = canvas.width * 0.8;
      let textWidth = ctx.measureText(watermarkText).width;
      while (textWidth > maxAllowed && fontSize > 10) {
        fontSize = Math.floor(fontSize * 0.9);
        ctx.font = `${fontSize}px ${baseFont}`;
        textWidth = ctx.measureText(watermarkText).width;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-0.35);

      ctx.font = `700 ${fontSize}px ${baseFont}`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText(watermarkText, 0, 0);
      ctx.strokeText(watermarkText, 0, 0);

      ctx.restore();
    };

    const handleLoadedMetadata = () => drawWatermark();
    const handleResize = () => drawWatermark();
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    window.addEventListener('resize', handleResize);

    if (video.readyState >= 1) drawWatermark();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('resize', handleResize);
    };
  }, [src, watermarkText]);

  // 🕒 Limit preview to first 5 seconds + autoplay muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play muted preview
    video.muted = true;
    video.play().catch((err) => {
      console.warn('Autoplay blocked:', err);
    });

    const handleTimeUpdate = () => {
      if (video.currentTime >= 5) {
        video.pause();
        setShowOverlay(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '900px' }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: '8px',
        }}
        playsInline
        muted
      />

      {/* Watermark canvas */}
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Overlay after 5 seconds */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            fontSize: '1.2rem',
            borderRadius: '8px',
          }}
        >
          <p style={{ marginBottom: '1rem' }}>🔒 Buy this content to unlock the full video.</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            (Only a short preview is available.)
          </p>
        </div>
      )}
    </div>
  );
};

export default WatermarkedVideo;

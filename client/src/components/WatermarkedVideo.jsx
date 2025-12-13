// client/src/components/WatermarkedVideo.jsx
import React, { useEffect, useRef, useState } from 'react';

const WatermarkedVideo = ({ src, watermarkText }) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [forceBlackout, setForceBlackout] = useState(false); // 🔥 For screenshot detection (hook only)

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

      // Fit watermark text
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

      // 🔥 Increased opacity & visibility
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 2.2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText(watermarkText, 0, 0);
      ctx.strokeText(watermarkText, 0, 0);
      ctx.restore();
    };

    video.addEventListener('loadedmetadata', drawWatermark);
    window.addEventListener('resize', drawWatermark);

    if (video.readyState >= 1) drawWatermark();

    return () => {
      video.removeEventListener('loadedmetadata', drawWatermark);
      window.removeEventListener('resize', drawWatermark);
    };
  }, [src, watermarkText]);

  // 🕒 Limited preview (first 5 seconds)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;

    video.play().catch(() => {});

    const stopAtFive = () => {
      if (video.currentTime >= 5) {
        video.pause();
        setShowOverlay(true);
      }
    };

    video.addEventListener('timeupdate', stopAtFive);
    return () => video.removeEventListener('timeupdate', stopAtFive);
  }, []);

  // ⭐ NEW — Right-click download: save a WATERMARKED frame
  const handleContextMenu = (e) => {
    e.preventDefault();

    const canvas = overlayRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'protected-video-frame.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', maxWidth: '900px' }}
      onContextMenu={handleContextMenu}
    >

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

      {/* Watermark Canvas */}
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Preview-lock overlay (after 5 sec) */}
      {showOverlay && !forceBlackout && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            (Preview limited to 5 seconds)
          </p>
        </div>
      )}

      {/* 🔥 Blackout layer (for screenshot protection — disabled by default) */}
      {forceBlackout && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            opacity: 0.97,
            borderRadius: '8px',
            pointerEvents: 'none',
          }}
        ></div>
      )}
    </div>
  );
};

export default WatermarkedVideo;

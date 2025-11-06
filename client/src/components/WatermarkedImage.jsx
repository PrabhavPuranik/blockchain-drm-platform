// client/src/components/WatermarkedImage.jsx
import React, { useEffect, useRef } from 'react';

const WatermarkedImage = ({ src, watermarkText }) => {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!img) return;

    const drawWatermark = () => {
      if (!img.naturalWidth) return;

      // Match canvas to image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Scale font so whole address fits once diagonally
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

      // Draw centered diagonal line
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

    // Draw once image is loaded
    if (img.complete && img.naturalWidth) {
      drawWatermark();
    } else {
      img.onload = drawWatermark;
    }

    window.addEventListener('resize', drawWatermark);
    return () => window.removeEventListener('resize', drawWatermark);
  }, [src, watermarkText]);

  return (
    <div style={{ position: 'relative', width: '100%', display: 'inline-block' }}>
      <img
        ref={imgRef}
        src={src}
        alt="Watermarked content"
        crossOrigin="anonymous"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default WatermarkedImage;

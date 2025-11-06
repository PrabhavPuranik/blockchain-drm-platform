// client/src/components/PlainVideo.jsx
import React from 'react';

const PlainVideo = ({ src }) => {
  return (
    <video
      src={src}
      controls
      style={{
        width: '100%',
        maxWidth: '900px',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    />
  );
};

export default PlainVideo;

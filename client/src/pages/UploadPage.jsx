// client/src/pages/UploadPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import './UploadPage.css';

const UploadPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [enableTimedAccess, setEnableTimedAccess] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !title || !price) {
      setMessage('⚠️ Please fill all fields and select a file.');
      return;
    }

    let totalSeconds = 0;
    if (enableTimedAccess) {
      totalSeconds =
        (Number(hours || 0) * 3600) +
        (Number(minutes || 0) * 60) +
        Number(seconds || 0);
      if (totalSeconds < 10) {
        setMessage('⚠️ Access time must be at least 10 seconds when enabled.');
        return;
      }
    }

    setIsLoading(true);
    setMessage('📤 Step 1/3: Uploading file and generating hash...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'File upload failed.');

      const { filePath, fileHash } = data;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const priceInWei = ethers.parseEther(price);

      setMessage('🔗 Step 2/3: Preparing blockchain transaction...');

      const tx = await contract.registerContent(
        title,
        priceInWei,
        filePath,
        '0x' + fileHash,
        totalSeconds
      );

      setMessage('⏳ Step 3/3: Waiting for transaction confirmation...');
      await tx.wait();

      setMessage('✅ Content successfully registered on blockchain!');
      sessionStorage.setItem('drm_refresh', 'true');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="upload-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="upload-title">Upload New Content</h1>

      <form onSubmit={handleSubmit} className="upload-form">
        {/* Title */}
        <motion.div
          className="form-group"
          whileFocus={{ scale: 1.02 }}
        >
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </motion.div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional short description..."
          />
        </div>

        {/* Price */}
        <div className="form-group">
          <label htmlFor="price">Price (in ETH)</label>
          <input
            type="number"
            id="price"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* Timed Access Toggle */}
        <div className="form-group timed-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={enableTimedAccess}
              onChange={(e) => setEnableTimedAccess(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span>Enable Timed Access</span>
        </div>

        {/* Time Duration */}
        {enableTimedAccess && (
          <motion.div
            className="form-group time-duration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <label>Access Duration</label>
            <div className="time-inputs">
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
                <span>hours</span>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
                <span>min</span>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                />
                <span>sec</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* File Input */}
        <div className="form-group">
          <label htmlFor="file">Content File</label>
          <input type="file" id="file" onChange={handleFileChange} required />
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          className="primary-action upload-btn"
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? 'Processing...' : 'Upload & Register'}
        </motion.button>
      </form>

      {message && (
        <motion.p
          className="feedback-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default UploadPage;

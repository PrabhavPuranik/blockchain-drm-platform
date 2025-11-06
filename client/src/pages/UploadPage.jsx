// Import dependencies
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import './UploadPage.css';

const UploadPage = () => {
  // State variables
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload + blockchain registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !title || !price) {
      setMessage('⚠️ Please fill in all fields and select a file.');
      return;
    }

    setIsLoading(true);
    setMessage('Step 1/3: Uploading file and generating hash...');

    try {
      // Step 1: Upload file to the server and generate hash
      const formData = new FormData();
      formData.append('file', file);

      const serverResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const serverData = await serverResponse.json();
      if (!serverResponse.ok) throw new Error(serverData.message || 'File upload failed.');

      const { filePath, fileHash } = serverData;
      const fileHashBytes32 = '0x' + fileHash; // Convert to bytes32

      setMessage('Step 2/3: Verifying uniqueness and preparing blockchain transaction...');

      // Step 2: Connect to Ethereum
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contentManager = new ethers.Contract(contractAddress, contractABI, signer);
      const priceInWei = ethers.parseEther(price);

      // Check duplicate before sending tx
      const alreadyExists = await contentManager.hashExists(fileHashBytes32);
      if (alreadyExists) {
        setIsLoading(false);
        setMessage('❌ Duplicate detected — this file already exists on the blockchain.');
        return;
      }

      // Step 3: Register content on blockchain
      setMessage('Step 3/3: Please confirm the transaction in MetaMask...');

      const tx = await contentManager.registerContent(
        title,
        priceInWei,
        filePath,
        fileHashBytes32
      );

      await tx.wait();

      setMessage('✅ Content successfully registered on the blockchain!');
      // 🟢 Tell browser to refresh data on homepage after navigation
    sessionStorage.setItem('drm_refresh', 'true');

      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('❌ Upload or blockchain error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload New Content</h1>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional short description..."
          />
        </div>

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

        <div className="form-group">
          <label htmlFor="file">Content File</label>
          <input type="file" id="file" onChange={handleFileChange} required />
        </div>

        <button type="submit" className="primary-action" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Upload & Register'}
        </button>
      </form>

      {message && <p className="feedback-message">{message}</p>}
    </div>
  );
};

export default UploadPage;

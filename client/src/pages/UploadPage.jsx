// Add useNavigate to the import from react-router-dom
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';
import './UploadPage.css';

const UploadPage = () => {
  // ... (keep all the existing useState variables)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize the navigate function
  const navigate = useNavigate();

  // ... (keep the handleFileChange function)
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (keep the initial validation)
    if (!file || !title || !price) {
      setMessage('Please fill in all fields and select a file.');
      return;
    }

    setIsLoading(true);
    setMessage('Step 1/3: Uploading file to the server...');

    try {
      // ... (keep the entire try block for uploading and blockchain transaction)
      const formData = new FormData();
      formData.append('file', file);
      const serverResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const serverData = await serverResponse.json();
      if (!serverResponse.ok) throw new Error(serverData.message || 'File upload failed');

      setMessage('Step 2/3: File uploaded. Preparing blockchain transaction...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contentManager = new ethers.Contract(contractAddress, contractABI, signer);
      const priceInWei = ethers.parseEther(price);
      const encryptedKeyPlaceholder = serverData.filePath;

      setMessage('Step 3/3: Please approve the transaction in MetaMask...');
      const transaction = await contentManager.registerContent(
        title,
        priceInWei,
        encryptedKeyPlaceholder
      );

      await transaction.wait();

      // === THE IMPROVEMENT ===
      // On success, navigate the user to the homepage
      navigate('/');

    } catch (error) {
      console.error('An error occurred:', error);
      setMessage(`Error: ${error.message}`);
      setIsLoading(false); // Make sure loading stops on error
    }
    // We don't need the finally block anymore as we navigate away on success
  };

  return (
    // ... (the return JSX remains exactly the same)
    <div className="upload-container">
      <h1>Upload New Content</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price (in ETH)</label>
          <input type="number" id="price" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} required />
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
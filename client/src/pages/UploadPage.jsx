import React, { useState } from 'react';
import { ethers } from 'ethers'; // Import the ethers library
import { contractAddress, contractABI } from '../contractInfo'; // Import our contract details
import './UploadPage.css';

const UploadPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Main function to handle the entire upload and registration process
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !price) {
      setMessage('Please fill in all fields and select a file.');
      return;
    }

    setIsLoading(true);
    setMessage('Step 1/3: Uploading file to the server...');

    // === STEP 1: UPLOAD FILE TO SERVER ===
    const formData = new FormData();
    formData.append('file', file);
    // We no longer need to send other metadata here, but you could if your server needs it

    try {
      const serverResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const serverData = await serverResponse.json();
      if (!serverResponse.ok) {
        throw new Error(serverData.message || 'File upload failed');
      }

      setMessage('Step 2/3: File uploaded. Preparing blockchain transaction...');
      console.log('File successfully uploaded:', serverData.filePath);

      // === STEP 2: REGISTER CONTENT ON BLOCKCHAIN ===
      // We need a "signer" to authorize the transaction from the user's wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create an instance of our contract, connected to the user's signer
      const contentManager = new ethers.Contract(contractAddress, contractABI, signer);

      // Convert the price from ETH (string) to Wei (BigInt)
      const priceInWei = ethers.parseEther(price);

      // The 'encryptedKeyCID' is a placeholder for now. Later, this will be a link to the
      // encrypted decryption key on a service like IPFS.
      const encryptedKeyPlaceholder = serverData.filePath;

      setMessage('Step 3/3: Please approve the transaction in MetaMask...');

      // Call the `registerContent` function on our smart contract
      const transaction = await contentManager.registerContent(
        title,
        priceInWei,
        encryptedKeyPlaceholder // Using the file path as a stand-in for now
      );

      // Wait for the transaction to be mined and confirmed on the blockchain
      await transaction.wait();

      setMessage('Success! Your content has been registered on the blockchain.');
      console.log('Transaction successful:', transaction);

    } catch (error) {
      console.error('An error occurred:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload New Content</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        {/* --- Form fields are unchanged --- */}
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
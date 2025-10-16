import React, { useState } from 'react';
import './UploadPage.css'; // We will create this file

const UploadPage = () => {
  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null); // To store the selected file object

  // State for handling feedback to the user
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    // The file input provides a FileList object
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission which reloads the page
    if (!file || !title || !price) {
      setMessage('Please fill in all fields and select a file.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    // Use FormData to send files and text fields together
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);

    try {
      // Send the form data to our backend server
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`File uploaded successfully! File path: ${data.filePath}`);
        // In a real app, we would next trigger a blockchain transaction here
      } else {
        throw new Error(data.message || 'File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
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
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price (in ETH)</label>
          <input
            type="number"
            id="price"
            step="0.001" // Allows for small fractions of ETH
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="file">Content File</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit" className="primary-action" disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {message && <p className="feedback-message">{message}</p>}
    </div>
  );
};

export default UploadPage;
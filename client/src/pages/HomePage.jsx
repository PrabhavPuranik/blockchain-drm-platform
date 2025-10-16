import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contractInfo';

import ContentCard from '../components/ContentCard';
import './HomePage.css';

const HomePage = () => {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true); // Set loading to true at the start of the fetch
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed.");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // === THE IMPROVEMENT ===
        // 1. Call our new function to get the exact count of items.
        const contentCount = await contract.getContentCount();
        const count = Number(contentCount);

        const fetchedContent = [];
        // 2. Loop from the most recent item downwards.
        for (let i = count; i >= 1; i--) {
          const content = await contract.contents(i);
          if (content.id !== 0n) {
            fetchedContent.push({
              id: Number(content.id),
              title: content.title,
              owner: content.owner,
              price: ethers.formatEther(content.price),
              isForSale: content.isForSale,
            });
          }
        }

        setContentList(fetchedContent); // The list is already reversed now
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (isLoading) {
    return <div className="loading-container">Loading content from the blockchain...</div>;
  }

  return (
    <main className="homepage-container">
      <h1>Discover Content</h1>
      {contentList.length > 0 ? (
        <div className="content-grid">
          {contentList.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <p className="no-content-message">No content has been registered yet. Be the first!</p>
      )}
    </main>
  );
};

export default HomePage;
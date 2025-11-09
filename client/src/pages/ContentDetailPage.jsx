import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../contractInfo";
import WatermarkedVideo from "../components/WatermarkedVideo";
import WatermarkedImage from "../components/WatermarkedImage";
import "./ContentDetailPage.css";

const ContentDetailPage = ({ account }) => {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimed, setIsTimed] = useState(false);
  const [message, setMessage] = useState("");

  // 🟢 Fetch content + user access info
  useEffect(() => {
    const fetchDetails = async () => {
      if (!account) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const item = await contract.contents(id);

        if (item.id === 0n) throw new Error("Content not found.");

        const fetched = {
          id: Number(item.id),
          title: item.title,
          creator: item.creator,
          owner: item.owner,
          price: item.price,
          filePath: item.encryptedKeyCID,
          accessDuration: Number(item.accessDuration)
        };

        setContent(fetched);
        setIsCreator(item.creator.toLowerCase() === account.toLowerCase());
        setIsTimed(fetched.accessDuration > 0);

        // Check user access from blockchain
        const access = await contract.hasAccess(id, account);
        setHasAccess(access);

        // Get remaining time if applicable
        if (fetched.accessDuration > 0) {
          const timeLeft = await contract.getRemainingTime(id, account);
          setRemainingTime(Number(timeLeft));
        }
      } catch (err) {
        console.error("Error fetching details:", err);
        setMessage(err.message);
      }
    };

    fetchDetails();
  }, [id, account]);

  // 🕒 Timer countdown for frontend display
  useEffect(() => {
    if (!hasAccess || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setHasAccess(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasAccess, remainingTime]);

  // 🕓 Format seconds → H:M:S
  const formatTime = (seconds) => {
    if (seconds <= 0) return "Expired";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // 💰 Purchase or renew access
  const handlePurchase = async () => {
    if (!content) return;
    setMessage("Processing purchase... Please approve in MetaMask.");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.purchaseContent(content.id, { value: content.price });
      await tx.wait();

      const access = await contract.hasAccess(content.id, account);
      const newTime = await contract.getRemainingTime(content.id, account);

      setHasAccess(access);
      setRemainingTime(Number(newTime));
      setMessage("✅ Access granted successfully!");
    } catch (error) {
      console.error("Purchase failed:", error);
      setMessage(`❌ Purchase failed: ${error.reason || error.message}`);
    }
  };

  // 🖼️ Render media (image/video with access control)
  const renderMedia = () => {
    if (!content) return null;

    const fileName = content.filePath.split("/").pop();
    const fullUrl = content.filePath.startsWith("/uploads")
      ? `http://localhost:8000${content.filePath}`
      : `http://localhost:8000/uploads/${fileName}`;

    const ext = fileName.split(".").pop().toLowerCase();
    const isVideo = ["mp4", "webm", "mov"].includes(ext);
    const isImage = ["png", "jpg", "jpeg", "gif"].includes(ext);

    if (isCreator || hasAccess) {
      return isVideo ? (
        <video src={fullUrl} className="detail-media" controls />
      ) : (
        <img src={fullUrl} alt={content.title} className="detail-media" />
      );
    } else {
      return isVideo ? (
        <WatermarkedVideo src={fullUrl} watermarkText={account || "UnauthorizedUser"} />
      ) : (
        <WatermarkedImage src={fullUrl} watermarkText={account || "UnauthorizedUser"} />
      );
    }
  };

  return (
    <div className="detail-container">
      {content ? (
        <>
          <div className="media-container-detail">{renderMedia()}</div>

          <div className="detail-info">
            <h1>{content.title}</h1>
            <p>
              <strong>Creator:</strong> {content.creator}
            </p>
            <p>
              <strong>Owner:</strong>{" "}
              {isTimed ? "Creator retains ownership (timed access)" : content.owner}
            </p>
            <div className="price-tag">{ethers.formatEther(content.price)} ETH</div>

            {/* 🕒 Access / Timer */}
            {isCreator ? (
              <p className="timer-text owner-text">You are the creator of this content.</p>
            ) : isTimed ? (
              hasAccess ? (
                <p className="timer-text">⏳ Access remaining: {formatTime(remainingTime)}</p>
              ) : (
                <p className="timer-text">🔒 Timed access expired or not active.</p>
              )
            ) : (
              <p className="timer-text">💫 Permanent purchase model.</p>
            )}

            {/* 🛒 Purchase / Renew */}
            <div className="action-box">
              {isCreator ? (
                <a
                  href={`http://localhost:8000${content.filePath}`}
                  download
                  className="primary-action download-button"
                >
                  Download File
                </a>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="primary-action buy-button"
                  disabled={hasAccess && (!isTimed || remainingTime > 0)}
                >
                  {hasAccess ? "Access Active" : "Buy / Renew Access"}
                </button>
              )}
            </div>

            {message && <p className="feedback-message">{message}</p>}
          </div>
        </>
      ) : (
        <div className="error-container">
          <p>{message || "Error: Content could not be loaded."}</p>
        </div>
      )}
    </div>
  );
};

export default ContentDetailPage;

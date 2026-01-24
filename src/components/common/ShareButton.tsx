// src/components/common/ShareButton.tsx
// STRATFIT — Share Button (Copy Link / Share Modal)

import React, { useState, useEffect } from 'react';
import { useLeverStore } from '../../state/leverStore';
import { useSimulationStore } from '../../state/simulationStore';

import './ShareButton.css';

interface ShareButtonProps {
  variant?: 'icon' | 'full';
  onShared?: () => void;
}

export default function ShareButton({
  variant = 'icon',
  onShared,
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'embed' | 'email'>('link');
  
  const levers = useLeverStore(s => s.levers);
  const simulation = useSimulationStore(s => s.summary);
  const hasSimulated = useSimulationStore(s => s.hasSimulated);
  
  // Generate shareable URL with lever state encoded
  const generateShareURL = () => {
    const baseURL = window.location.origin + window.location.pathname;
    const leverParams = new URLSearchParams();
    
    // Encode lever values
    Object.entries(levers).forEach(([key, value]) => {
      leverParams.set(key, String(value));
    });
    
    return `${baseURL}?${leverParams.toString()}`;
  };
  
  // Generate embed code
  const generateEmbedCode = () => {
    const url = generateShareURL();
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" title="STRATFIT Scenario"></iframe>`;
  };
  
  // Generate email body
  const generateEmailBody = () => {
    const url = generateShareURL();
    const survivalText = simulation ? `${Math.round(simulation.survivalRate * 100)}% survival probability` : '';
    const arrText = simulation ? `$${(simulation.arrMedian / 1e6).toFixed(1)}M projected ARR` : '';
    
    return encodeURIComponent(
      `Check out this STRATFIT scenario:\n\n` +
      `${survivalText}\n${arrText}\n\n` +
      `View and adjust the strategy: ${url}\n\n` +
      `—\nGenerated with STRATFIT - Scenario Intelligence Platform`
    );
  };
  
  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShared?.();
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShared?.();
    }
  };
  
  // Open email client
  const handleEmailShare = () => {
    const subject = encodeURIComponent('STRATFIT Strategy Scenario');
    const body = generateEmailBody();
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onShared?.();
  };
  
  // Native share (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'STRATFIT Scenario',
          text: simulation 
            ? `${Math.round(simulation.survivalRate * 100)}% survival • $${(simulation.arrMedian / 1e6).toFixed(1)}M ARR`
            : 'Check out this strategy scenario',
          url: generateShareURL(),
        });
        onShared?.();
      } catch (err) {
        // User cancelled or error
      }
    } else {
      setShowModal(true);
    }
  };
  
  // Close modal on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  
  return (
    <>
      <button
        className={`share-btn ${variant}`}
        onClick={handleNativeShare}
        title="Share Scenario"
      >
        <span className="btn-icon">🔗</span>
        {variant === 'full' && <span className="btn-text">SHARE</span>}
      </button>
      
      {/* Share Modal */}
      {showModal && (
        <div className="share-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Scenario</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Quick stats preview */}
              {simulation && (
                <div className="share-preview">
                  <div className="preview-stat">
                    <span className="stat-value">{Math.round(simulation.survivalRate * 100)}%</span>
                    <span className="stat-label">Survival</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-value">${(simulation.arrMedian / 1e6).toFixed(1)}M</span>
                    <span className="stat-label">ARR</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-value">{Math.round(simulation.runwayMedian)}mo</span>
                    <span className="stat-label">Runway</span>
                  </div>
                </div>
              )}
              
              {/* Share method tabs */}
              <div className="share-tabs">
                <button
                  className={`tab ${shareMethod === 'link' ? 'active' : ''}`}
                  onClick={() => setShareMethod('link')}
                >
                  🔗 Link
                </button>
                <button
                  className={`tab ${shareMethod === 'embed' ? 'active' : ''}`}
                  onClick={() => setShareMethod('embed')}
                >
                  {'</>'} Embed
                </button>
                <button
                  className={`tab ${shareMethod === 'email' ? 'active' : ''}`}
                  onClick={() => setShareMethod('email')}
                >
                  ✉️ Email
                </button>
              </div>
              
              {/* Link share */}
              {shareMethod === 'link' && (
                <div className="share-content">
                  <label>Shareable Link</label>
                  <div className="copy-row">
                    <input
                      type="text"
                      value={generateShareURL()}
                      readOnly
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      className={`copy-btn ${copied ? 'copied' : ''}`}
                      onClick={() => handleCopy(generateShareURL())}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="share-note">
                    Anyone with this link can view and modify the scenario.
                    Their changes won't affect your saved version.
                  </p>
                </div>
              )}
              
              {/* Embed share */}
              {shareMethod === 'embed' && (
                <div className="share-content">
                  <label>Embed Code</label>
                  <div className="copy-row">
                    <textarea
                      value={generateEmbedCode()}
                      readOnly
                      rows={3}
                      onClick={e => (e.target as HTMLTextAreaElement).select()}
                    />
                    <button
                      className={`copy-btn ${copied ? 'copied' : ''}`}
                      onClick={() => handleCopy(generateEmbedCode())}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="share-note">
                    Paste this code to embed the scenario in your website or pitch deck.
                  </p>
                </div>
              )}
              
              {/* Email share */}
              {shareMethod === 'email' && (
                <div className="share-content">
                  <label>Share via Email</label>
                  <p className="share-description">
                    Send this scenario to investors, advisors, or team members.
                  </p>
                  <button className="email-btn" onClick={handleEmailShare}>
                    <span className="btn-icon">✉️</span>
                    Open Email Client
                  </button>
                  <p className="share-note">
                    This will open your default email app with a pre-filled message.
                  </p>
                </div>
              )}
            </div>
            
            {/* Quick actions */}
            <div className="modal-footer">
              <div className="quick-share">
                <span className="quick-label">Quick share:</span>
                <button
                  className="quick-btn"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(generateShareURL())}&text=${encodeURIComponent('Check out my strategy scenario on STRATFIT')}`, '_blank')}
                  title="Share on Twitter"
                >
                  𝕏
                </button>
                <button
                  className="quick-btn"
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generateShareURL())}`, '_blank')}
                  title="Share on LinkedIn"
                >
                  in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

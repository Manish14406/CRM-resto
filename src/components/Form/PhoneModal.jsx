import React, { useState } from 'react';

/**
 * PhoneModal Component
 * 
 * Purpose: A highly-trusted centered popup overlay to gather mobile numbers securely.
 * 
 * Trust Design: White card on dark background, rounded edges, and trust-focused copy 
 * greatly increases conversion rates without feeling intrusive.
 */
export default function PhoneModal({ isOpen, onSubmit }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation Logic (No basic alert() used):
    // ^[6-9]: Starts exclusively with Indian mobile identifiers 6, 7, 8, or 9
    // \d{9}$: Ensures exactly 9 digits follow
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(phone)) {
      // Show inline error for better UX instead of a jarring alert modal
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    // Emit the validated phone number to the parent component
    onSubmit(phone);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Unlock Your Reward 🎁</h2>
        <p className="modal-subtitle">Enter your mobile number to reveal your exclusive offer</p>

        <form onSubmit={handleSubmit} className="phone-form">
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            maxLength={10}
            onChange={(e) => {
              // Ensure strictly numbers are allowed
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 10) setPhone(val);
            }}
          />
          {error && <p className="error-text">{error}</p>}
          
          <button type="submit" className="unlock-button" disabled={phone.length !== 10}>
            Unlock Now
          </button>
        </form>

        {/* Trust Signals: Increases user confidence to enter their number */}
        <div className="trust-signals">
          <p>🔒 We respect your privacy</p>
          <p>✨ No spam guaranteed</p>
          <p>👥 Used by 500+ happy customers</p>
        </div>
      </div>
    </div>
  );
}

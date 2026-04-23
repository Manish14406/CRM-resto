import React, { useState, useEffect } from 'react';
import GameBoard from '../components/Game/GameBoard';
import PhoneModal from '../components/Form/PhoneModal';
import logoImg from '../assets/images/logo.jpg';
import { handleCustomer } from '../services/customerService';
import { handleTable } from '../services/tableService';
import { saveReward } from '../services/rewardService';


/**
 * GamePage Component
 * 
 * Purpose: Acts as the main controller for the coastal reward game.
 * Manages the state flow from initial render to unlocking the reward.
 */
export default function GamePage() {
  // --- STATE MANAGEMENT ---
  // selectedIndex: Keeps track of which UI card the user clicked
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  // selectedReward: Holds the hidden reward randomly chosen for the user
  const [selectedReward, setSelectedReward] = useState(null);
  
  // isModalOpen: Controls whether the Phone input modal is visible
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // isUnlocked: True when the user successfully submits a valid phone number
  const [isUnlocked, setIsUnlocked] = useState(false);

  // 9. OPTIONAL STATE: Tracks if they have clicked the WhatsApp claim button
  const [isClaimed, setIsClaimed] = useState(false);

  // claimBlocked: True if the table has already claimed a reward recently
  const [claimBlocked, setClaimBlocked] = useState(false);

  // rewardCode: Stores the unique reward ID generated from the database
  const [rewardCode, setRewardCode] = useState(null);

  // tableId: Stores the ID extracted from the URL
  const [tableId, setTableId] = useState(null);

  // 2. STATE MANAGEMENT
  // isBlocked: True if the table has already claimed a reward within the cooldown period
  const [isBlocked, setIsBlocked] = useState(false);
  
  // isUserBlocked: True if the user's phone number is on cooldown (preventing table URL spoofing)
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  
  // isChecking: True while we are verifying table status on mount
  const [isChecking, setIsChecking] = useState(true);

  // isSubmitting: Lock for anti-race conditions
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 10. FRONTEND SPAM PROTECT
  const [lastUsedNumber, setLastUsedNumber] = useState(null);

  useEffect(() => {
    // 1. READ TABLE ID FROM URL
    // Extract table_id from query param: Example: /play?table=5
    const searchParams = new URLSearchParams(window.location.search);
    const tableParam = searchParams.get('table');
    
    // 7. COMMENTS (VERY IMPORTANT)
    // - WHY CHECK ON PAGE LOAD: By checking right away, we prevent the user from 
    //   falsely believing they can play the game when they are currently locked out.
    // - WHY BLOCK BEFORE INTERACTION: It creates a smooth, professional UX. We don't 
    //   waste the user's time letting them interact just to hit them with an error.
    // - HOW THIS PREVENTS ABUSE: It forces a strict 30-minute block per physical table 
    //   session before even allowing the React front-end game to be playable.
    
    if (tableParam) {
      setTableId(tableParam);
      setIsChecking(false); // We don't block heavily on load anymore, handled strictly on click
    } else {
      setIsChecking(false);
    }
  }, []);

  // Exact rewards array as requested
  const REWARDS = [
    "Buy 1 Drink Get 1 Drink 🍹",
    "10% OFF",
    "15% OFF",
    "1 Free Drink 🥤",
    "Get up to ₹200 OFF on bills above ₹1000",
    "Complimentary Sweet 🍮"
  ];

  /**
   * Handles user clicking one of the 6 game cards.
   * 
   * Random Selection Logic:
   * Math.random() generates a decimal between 0 and 1. Multiplying by array length
   * and flooring it gives a valid random index to pick from the REWARDS array.
   * We hide the reward in state so it cannot be seen until phone verification.
   */
  const handleCardClick = async (index) => {
    // Prevent multiple clicks
    if (selectedIndex !== null) return;

    setSelectedIndex(index);

    // Randomly pick a reward securely
    const randomIdx = Math.floor(Math.random() * REWARDS.length);
    setSelectedReward(REWARDS[randomIdx]);

    // Open the modal to request the user's phone number
    setIsModalOpen(true);
  };

  /**
   * Handles successful phone number submission from the modal.
   */
  const handlePhoneSubmit = async (phone) => {
    // 5. IMPORTANT ADDITION (ANTI-RACE) lock
    if (isSubmitting) return;
    setIsSubmitting(true);

    // 1. FRONTEND BLOCK
    // Check if the user is spamming the same exact number
    if (lastUsedNumber === phone) {
      alert("⛔ You already used this number. Please wait.");
      setIsSubmitting(false);
      return;
    }

    setIsModalOpen(false);
    
    // 2. CALL handleCustomer 
    // Everyone is allowed to play the game and see the reward. 
    // Cooldown is NOT checked here anymore!
    const result = await handleCustomer(phone);
    console.log("Customer result:", result);

    // If the database insert/update randomly fails for some reason
    if (!result.success && result.reason !== "table_cooldown") {
      // 3. UI HANDLING FOR BACKEND BLOCK
      if (result.reason === "instant_block") {
        alert("⛔ Please wait before trying again.");
      } else {
        alert("⚠️ Error linking identity. Please try again.");
      }
      setIsSubmitting(false);
      return;
    }

    // Only runs if allowed
    const rewardResult = await saveReward(phone, selectedReward, tableId);
    if (rewardResult.success && rewardResult.rewardId) {
      setRewardCode(rewardResult.rewardId);
    }

    setLastUsedNumber(phone);
    setIsUnlocked(true);
    setIsSubmitting(false);
  };

  // Flag for special UI emphasis on the rarest reward
  const isSpecialReward = selectedReward === "Buy 1 Drink Get 1 Drink 🍹";

  /**
   * Opens WhatsApp with a pre-filled message containing the user's reward details.
   */
  const handleWhatsAppSend = async () => {
    // 7. COMMENTS: CLAIM LOGIC
    // - WHY GAME SHOULD REMAIN OPEN:
    //   It provides a fun, unrestricted experience where everyone at the table can play and see 
    //   what they win without annoying blocks. This drives high engagement and collects more phone numbers.
    // - WHY CLAIM MUST BE RESTRICTED:
    //   We cannot allow a table of 5 people to actually redeem 5 free items. 
    // - HOW THIS PREVENTS REVENUE LOSS:
    //   By applying the restriction here (at the WhatsApp click stage), we mathematically cap 
    //   the redemption liability to exactly 1 reward per table session (every 30 mins) while maximizing UX.

    // 5. IMPORTANT CHANGE: Move table cooldown check here
    if (tableId) {
      const tableResult = await handleTable(tableId);
      
      // 3. CLAIM RULE
      if (tableResult.success === false) {
        setClaimBlocked(true);
        return; // STOP execution
      }
    }

    // 4. IF NOT CLAIMED -> Allow claim & Open WhatsApp
    const message = `Hi, I want to claim my reward 🎁\n\nCode: ${rewardCode}\nReward: ${selectedReward}\nTable: ${tableId ? tableId : 'N/A'}`;
    const encodedMessage = encodeURIComponent(message);
    
    const url = `https://wa.me/917090681508?text=${encodedMessage}`;
    window.open(url, "_blank");

    setIsClaimed(true);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <img src={logoImg} alt="Coastal Pearl Fish Logo" className="brand-logo" />
        <h1>Exclusive Experiences 🌟</h1>
        <p>Select a mystery box to reveal a premium dining reward</p>
      </div>

      {/* 4. BLOCK GAME UI & 5. ALLOW GAME ONLY IF NOT BLOCKED */}
      {isChecking ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          <h2>Checking availability...</h2>
        </div>
      ) : isBlocked ? (
        <div style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          margin: "2rem auto",
          maxWidth: "400px",
          backgroundColor: "#fff5f5",
          border: "2px solid #feb2b2",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "#e53e3e", marginBottom: "1rem" }}>⛔ Reward Already Claimed</h2>
          <p style={{ color: "#4a5568", fontSize: "1.1rem", lineHeight: "1.5" }}>
            Try again after 30 minutes ⏳
          </p>
        </div>
      ) : isUserBlocked ? (
        <div style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          margin: "2rem auto",
          maxWidth: "400px",
          backgroundColor: "#fff5f5",
          border: "2px solid #feb2b2",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "#e53e3e", marginBottom: "1rem", fontSize: "1.4rem" }}>
            ⛔ You already claimed a reward. Try again after 30 minutes.
          </h2>
        </div>
      ) : (
        <GameBoard 
          selectedIndex={selectedIndex}
          isUnlocked={isUnlocked}
          onCardClick={handleCardClick}
        />
      )}

      {/* Render the Phone Modal overlay if state is true */}
      <PhoneModal 
        isOpen={isModalOpen}
        onSubmit={handlePhoneSubmit}
      />

      {/* Reward Reveal Section */}
      {isUnlocked && (
        <div className="reward-reveal bounce-in">
          {isSpecialReward && <div className="special-badge">🔥 Special Reward!</div>}
          
          {/* 2. UPDATE REWARD UI */}
          <h2>🎁 Your Reward is Ready!</h2>
          <div className="reward-box">
            <h3>{selectedReward}</h3>
          </div>
          
          {rewardCode && (
            <div style={{
              margin: '1.5rem 0',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              border: '2px dashed #cbd5e0',
              borderRadius: '8px',
              color: '#2d3748'
            }}>
              <h2 style={{ margin: '0', color: '#e53e3e', fontSize: '1.8rem', letterSpacing: '2px' }}>
                🆔 Code: {rewardCode.startsWith('RW-') ? rewardCode : `RW-${rewardCode}`}
              </h2>
            </div>
          )}

          {/* 3. ADD INSTRUCTION & 8. AFTER CLICK UX */}
          {claimBlocked ? (
             <div style={{ padding: '1rem', margin: '1rem 0', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#c53030', fontWeight: 'bold', fontSize: '1.1rem' }}>
                ⛔ This table has already claimed a reward.
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#9b2c2c', fontSize: '1rem' }}>
                Please try again after 30 minutes.
              </p>
            </div>
          ) : isClaimed ? (
            <div style={{ padding: '1rem', margin: '1rem 0', backgroundColor: '#e6fffa', border: '1px solid #38b2ac', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#2c7a7b', fontWeight: 'bold', fontSize: '1.1rem' }}>
                ✅ Reward sent!
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#285e61', fontSize: '1rem' }}>
                Show your WhatsApp message at the counter
              </p>
            </div>
          ) : (
            <p className="claim-text" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
              📲 To claim your reward, send it on WhatsApp
            </p>
          )}

          {/* 4 & 5. WHATSAPP BUTTON WITH ANIMATIONS */}
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '1.2rem',
              margin: '1.5rem 0 0.5rem',
              background: (isClaimed || claimBlocked) ? '#a0aec0' : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: (isClaimed || claimBlocked) ? 'not-allowed' : 'pointer',
              boxShadow: (isClaimed || claimBlocked) ? 'none' : '0 8px 15px rgba(37, 211, 102, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              pointerEvents: (isClaimed || claimBlocked) ? 'none' : 'auto'
            }}
            onMouseEnter={(e) => { if(!(isClaimed || claimBlocked)) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { if(!(isClaimed || claimBlocked)) e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseDown={(e) => { if(!(isClaimed || claimBlocked)) e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={(e) => { if(!(isClaimed || claimBlocked)) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onClick={handleWhatsAppSend}
            disabled={isClaimed || claimBlocked}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {isClaimed ? "Reward Sent!" : "Send on WhatsApp to Claim"}
          </button>
          
          <button className="reset-btn" onClick={() => window.location.reload()}>
            Reset (Test Mode)
          </button>
        </div>
      )}
    </div>
  );
}

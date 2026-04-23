import React from 'react';

/**
 * GameCard Component
 * 
 * Purpose: Renders an individual elegant reward box.
 * Why it exists: Abstracting the card UI ensures clean rendering and separates
 * interactive logic from the parent board.
 * 
 * Premium Theme Improvements:
 * - Removed emojis and basic elements
 * - Replaced with an elegant "Tap to Reveal 🎁" text inside the gradient frame
 */
export default function GameCard({ index, isSelected, isUnlocked, onClick }) {
  // Disable clicking if any card has already been selected
  const isDisabled = isSelected !== null;

  return (
    <div 
      className={`game-card ${isSelected === index ? 'selected' : ''} ${isDisabled && isSelected !== index ? 'inactive' : ''}`}
      onClick={() => {
        if (!isDisabled) onClick(index);
      }}
    >
      <div className="card-content">
        {isSelected === index && isUnlocked ? (
          <span className="card-text">Unlocked! ✨</span>
        ) : isSelected === index ? (
          <span className="card-text">LOCKED 🔒</span>
        ) : (
          <span className="card-text">Tap to Reveal 🎁</span>
        )}
      </div>
    </div>
  );
}

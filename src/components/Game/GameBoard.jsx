import React from 'react';
import GameCard from './GameCard';

/**
 * GameBoard Component
 * 
 * Purpose: Renders the 6-item grid of mystery cards.
 * Why it exists: Handles the responsive layout (2 cols mobile, 3 cols desktop)
 * and maps the states to the individual GameCard components.
 */
export default function GameBoard({ selectedIndex, isUnlocked, onCardClick }) {
  // Generate an array of 6 elements for our grid
  const cards = Array.from({ length: 6 }).map((_, i) => i);

  return (
    <div className="game-board">
      {cards.map((index) => (
        <GameCard
          key={index}
          index={index}
          isSelected={selectedIndex}
          isUnlocked={isUnlocked}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}

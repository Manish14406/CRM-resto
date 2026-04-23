import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import our page components
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';

/**
 * App component
 * 
 * Purpose: This is the root component of the React application.
 * Why it exists: It delegates rendering logic purely to the Router, keeping
 * the base configuration clean and centralized.
 */
function App() {
  return (
    // Router wraps our application to enable client-side navigation
    <Router>
      <Routes>
        {/* Public facing game page. Accessible via root path or /play */}
        <Route path="/" element={<GamePage />} />
        <Route path="/play" element={<GamePage />} />
        
        {/* Protected admin dashboard. Accessible via /admin */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* Fallback route to redirect users to the game page if path is not found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

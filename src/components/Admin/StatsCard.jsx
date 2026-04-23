import React from 'react';

/**
 * StatsCard Component
 * Displays a simple, clean card showing a title and a value for the admin dashboard.
 */
export default function StatsCard({ title, value, color = "#2b6cb0" }) {
  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      padding: "1.5rem",
      margin: "0.5rem",
      flex: 1,
      minWidth: "200px",
      textAlign: "center",
      borderTop: `4px solid ${color}`
    }}>
      <h3 style={{ margin: "0 0 0.5rem 0", color: "#4a5568", fontSize: "1rem" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: color }}>{value}</p>
    </div>
  );
}

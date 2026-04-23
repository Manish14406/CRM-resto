import React, { useState } from 'react';

/**
 * CustomerTable Component
 * 
 * --- COMMENTS: TARGETING INACTIVE CUSTOMERS ---
 * 1. WHY INACTIVE USERS ARE IMPORTANT:
 * Customers who haven't visited in 20+ days represent "churn" risk. Getting them back through 
 * the door is often 5x cheaper than acquiring brand new customers.
 * 
 * 2. HOW THIS INCREASES REVENUE:
 * By offering a direct 15% discount strictly to lapsed users, we incentivize immediate return visits,
 * reactivating their lifetime value directly onto the restaurant's bottom line.
 * 
 * 3. HOW WHATSAPP SIMPLIFIES OUTREACH:
 * Instead of dealing with expensive SMS gateways, WhatsApp provides free, high-open-rate messaging.
 * The Dispatch Queue organizes the numbers so the admin can rapidly fire off 1-to-1 personalized 
 * messages natively through the WhatsApp Web application without triggering browser popup blockers.
 */
export default function CustomerTable({ customers }) {
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);

  if (!customers || customers.length === 0) {
    return <p style={{ textAlign: "center", color: "#718096", padding: "2rem" }}>No customers found.</p>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return '#3182ce'; // Blue
      case 'Active': return '#38a169'; // Green
      case 'Inactive': return '#e53e3e'; // Red
      default: return '#718096';
    }
  };

  // Identify targets to populate the 'Select All' shortcut
  const inactiveCustomers = customers.filter(c => c.status === 'Inactive');

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPhones(inactiveCustomers.map(c => c.phone_number));
    } else {
      setSelectedPhones([]);
      setIsDispatching(false);
    }
  };

  const handleToggle = (phone) => {
    if (selectedPhones.includes(phone)) {
      setSelectedPhones(selectedPhones.filter(p => p !== phone));
      if (selectedPhones.length === 1) setIsDispatching(false); // Close queue if empty
    } else {
      setSelectedPhones([...selectedPhones, phone]);
    }
  };

  const encodedMessage = encodeURIComponent(
    "Hi! We miss you at Coastal Seafood 🐟\n\nEnjoy a special offer 🎁\nGet 15% OFF on your next visit!\n\nShow this message at the restaurant."
  );

  return (
    <div>
      {/* 3. ADD BUTTON & 7. UI IMPROVEMENT */}
      {selectedPhones.length > 0 && !isDispatching && (
        <div style={{ marginBottom: "1rem", padding: "1.2rem", backgroundColor: "#fff5f5", border: "1px solid #feb2b2", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, color: "#c53030" }}>Target Inactive Customers</h3>
            <p style={{ margin: "0.25rem 0 0 0", color: "#e53e3e", fontSize: "0.95rem" }}>
              <strong>{selectedPhones.length}</strong> users selected for the campaign.
            </p>
          </div>
          <button 
            onClick={() => setIsDispatching(true)}
            style={{ padding: "0.75rem 1.5rem", backgroundColor: "#38a169", color: "white", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(56, 161, 105, 0.3)" }}
          >
            📲 Send Offer to Selected Customers
          </button>
        </div>
      )}

      {/* 6. MULTIPLE USERS HANDLING: DISPATCH QUEUE */}
      {isDispatching && (
        <div style={{ marginBottom: "1.5rem", padding: "1.5rem", backgroundColor: "#f0fff4", border: "2px solid #9ae6b4", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, color: "#276749" }}>WhatsApp Dispatch Queue ({selectedPhones.length})</h3>
            <button onClick={() => setIsDispatching(false)} style={{ background: "transparent", border: "none", color: "#4a5568", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}>Cancel Dispatch</button>
          </div>
          <p style={{ color: "#2f855a", fontSize: "0.9rem", marginBottom: "1rem", fontStyle: "italic" }}>
            Click 'Send' on each number to natively open WhatsApp. The number will automatically clear from the queue.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {selectedPhones.map(phone => (
              <li key={phone} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: "1rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontWeight: "bold", color: "#2d3748", fontSize: "1.1rem" }}>{phone}</span>
                <a 
                  href={`https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodedMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleToggle(phone)} 
                  style={{ padding: "0.6rem 1.2rem", backgroundColor: "#128C7E", color: "white", borderRadius: "5px", textDecoration: "none", fontSize: "0.95rem", fontWeight: "bold" }}
                >
                  Send WhatsApp
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TABLE SECTION */}
      <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f7fafc", borderBottom: "1px solid #e2e8f0" }}>
            <tr>
              <th style={{ padding: "1rem", width: "50px", textAlign: "center" }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={selectedPhones.length > 0 && selectedPhones.length === inactiveCustomers.length}
                  title="Select all inactive customers"
                />
              </th>
              <th style={{ padding: "1rem", color: "#4a5568", fontWeight: "600" }}>Phone Number</th>
              <th style={{ padding: "1rem", color: "#4a5568", fontWeight: "600" }}>Last Visit Date</th>
              <th style={{ padding: "1rem", color: "#4a5568", fontWeight: "600" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust, idx) => (
              <tr key={idx} style={{ 
                borderBottom: "1px solid #e2e8f0", 
                backgroundColor: selectedPhones.includes(cust.phone_number) ? "#ebf8ff" : "#fff",
                transition: "background-color 0.2s ease"
              }}>
                <td style={{ padding: "1rem", textAlign: "center" }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPhones.includes(cust.phone_number)}
                    onChange={() => handleToggle(cust.phone_number)}
                  />
                </td>
                <td style={{ padding: "1rem", color: "#2d3748", fontWeight: "500" }}>{cust.phone_number}</td>
                <td style={{ padding: "1rem", color: "#2d3748" }}>
                  {cust.last_visit_date ? new Date(cust.last_visit_date).toLocaleDateString() : 'Unknown'}
                </td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ 
                    backgroundColor: cust.status === 'Inactive' ? '#fff5f5' : `${getStatusColor(cust.status)}15`, 
                    color: getStatusColor(cust.status),
                    padding: "0.3rem 0.8rem",
                    borderRadius: "9999px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    border: cust.status === 'Inactive' ? '1px solid #feb2b2' : 'none'
                  }}>
                    {cust.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

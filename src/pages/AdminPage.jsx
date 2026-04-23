import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import StatsCard from '../components/Admin/StatsCard';
import CustomerTable from '../components/Admin/CustomerTable';
import VisitChart from '../components/Admin/VisitChart';
import { resetTableSession } from '../services/tableService';

/**
 * AdminPage component
 * 
 * Purpose: This is the protected dashboard for the restaurant owner or manager.
 * 
 * --- COMMENTS EXPLAINING DASHBOARD FUNCTIONALITY ---
 * 1. HOW CUSTOMERS ARE FETCHED:
 * We use `supabase.from('customers').select('*')` inside a useEffect hook to 
 * pull all database rows immediately upon page load.
 * 
 * 2. HOW DATE COMPARISON WORKS:
 * We instantiate `new Date()` for right now, and `new Date(cust.last_visit_date)`
 * for the customer's last interaction. Subtracting them yields milliseconds, which 
 * we convert to Days (`diffDays`). 
 * 
 * 3. HOW CATEGORIZATION WORKS:
 * - "New Customers": Identified if `total_visits === 1` OR if their `created_at` 
 *   date perfectly matches their `last_visit_date` (meaning they just joined).
 * - "Active Customers": `diffDays <= 20`. Visited in the last 20 days.
 * - "Inactive Customers": `diffDays > 20`. Visited over 20 days ago.
 * 
 * 4. FUTURE FEATURES (WhatsApp Automation):
 * By grouping our inactive users here, we clearly surface phone numbers that have 
 * dropped off. In a future update, we can connect a Twilio or WhatsApp Business API
 * to iterate over the "Inactive" list and send an automated "We miss you! Here is 15% off"
 * message to precisely recapture lost revenue.
 */
export default function AdminPage() {
  // 1. CREATE LOGIN CHECK
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("admin_auth") === "true"
  );
  const [passwordInput, setPasswordInput] = useState('');

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newCust: 0
  });

  // Reseting specific table sessions
  const [resetTableId, setResetTableId] = useState('');
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  // Only fetch if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  // 3. PASSWORD CHECK
  const handleLogin = (e) => {
    e.preventDefault();
    const ADMIN_PASSWORD = "admin123";
    if (passwordInput === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("⛔ Incorrect password");
    }
  };

  // 5. LOGOUT BUTTON Logic
  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fecth all customers from Supabase (Error handling on empty/invalid data mapping below)
      const { data, error } = await supabase.from('customers').select('*');
      
      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      processCustomerData(data || []);
      
    } catch (err) {
      console.error('Unexpected error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processCustomerData = (data) => {
    const now = new Date();
    let computedStats = { total: data.length, active: 0, inactive: 0, newCust: 0 };
    
    const processedList = data.map(cust => {
      let status = "Inactive";
      const lastVisit = cust.last_visit_date ? new Date(cust.last_visit_date) : now;
      const diffDays = (now - lastVisit) / (1000 * 60 * 60 * 24);
      
      // Attempt to identify New visitors based on total_visits field or creation date
      let isNew = false;
      if (cust.total_visits === 1) {
        isNew = true;
      } else if (cust.created_at) {
        const created = new Date(cust.created_at);
        const diffCreation = Math.abs((lastVisit - created) / (1000 * 60 * 60 * 24));
        if (diffCreation < 1) {
          isNew = true; // Effectively joined recently
        }
      }

      // Group exactly per business requirements
      if (isNew) {
        status = "New";
        computedStats.newCust++;
      } else if (diffDays <= 20) {
        status = "Active";
        computedStats.active++;
      } else {
        status = "Inactive";
        computedStats.inactive++;
      }

      return { ...cust, status };
    });

    // Process Chart Data (Last 14 days of engagement)
    const dateMap = {};
    processedList.forEach(cust => {
      if (cust.last_visit_date) {
        const d = new Date(cust.last_visit_date);
        const yyyyMmDd = d.toISOString().split('T')[0];
        dateMap[yyyyMmDd] = (dateMap[yyyyMmDd] || 0) + 1;
      }
    });

    // Sort chronologically and limit to the last 14 days
    const recentDates = Object.keys(dateMap).sort().slice(-14);
    
    const formattedChartData = recentDates.map(dateStr => {
      const d = new Date(dateStr);
      return {
        // Use UTC display to cleanly strip the day without confusing local timezone rollbacks
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        count: dateMap[dateStr]
      };
    });

    setChartData(formattedChartData);
    setCustomers(processedList);
    setStats(computedStats);
  };

  const handleResetTable = async () => {
    if (!resetTableId.trim()) {
      setResetMessage({ type: 'error', text: 'Please enter a table number.' });
      return;
    }
    
    setResetMessage({ type: 'loading', text: 'Resetting table access...' });
    
    try {
      await resetTableSession(resetTableId.trim());
      setResetMessage({ type: 'success', text: `Table ${resetTableId} access has been reset successfully!` });
      setResetTableId('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setResetMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error resetting table:', err);
      setResetMessage({ type: 'error', text: 'Failed to reset table. Please check logs.' });
    }
  };

  // 6. COMMENTS: SECURITY
  // - WHY THIS IS BASIC PROTECTION: 
  //   This stores a simple flag in localStorage and checks a hardcoded password on the frontend.
  //   It is not cryptographically secure against an advanced hacker reading the source code.
  // - WHY STATE IS NEEDED:
  //   localStorage alone is not reactive. If we just read localStorage inline, the component 
  //   would not strictly re-render when the user successfully logs in or out. Tying it to 
  //   useState forces the React lifecycles to obey the authentication conditionally.
  // - HOW IT PREVENTS PUBLIC ACCESS:
  //   It reliably acts as a strong "door lock" for casual users or customers who might snoop 
  //   into the /admin URL. Without the password, the React component mathematically refuses 
  //   to render the dashboard or execute the Supabase fetch commands, safeguarding privacy.

  // 2. IF NOT AUTHENTICATED (MUST BE CHECKED FIRST, OR 'LOADING' BLOCKS THE LOGIN SCREEN)
  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#f7fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', padding: '3rem 2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', color: '#2d3748' }}>Admin Login 🔒</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password"
              placeholder="Enter Admin Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
              autoFocus
            />
            <button 
              type="submit"
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. AFTER AUTHENTICATION IS CONFIRMED, CHECK IF DATA IS STILL LOADING
  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#4a5568', fontFamily: "system-ui, sans-serif" }}>
        <h2>Loading Dashboard metrics...</h2>
      </div>
    );
  }

  // 4. IF AUTHENTICATED
  return (
    <div style={{ backgroundColor: '#f7fafc', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#2d3748' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>Restaurant CRM Admin</h1>
          {/* 5. LOGOUT BUTTON */}
          <button 
            onClick={handleLogout}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}
          >
            Logout
          </button>
        </div>
        
        {/* DASHBOARD STATS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <StatsCard title="Total Customers" value={stats.total} color="#2b6cb0" />
          {/* We combine 'Active' and 'New' strictly for the high-level Active Customer card visualization, but isolate them in the table */}
          <StatsCard title="Active Customers" value={stats.active + stats.newCust} color="#38a169" />
          <StatsCard title="Inactive Customers" value={stats.inactive} color="#e53e3e" />
        </div>

        {/* 4. CUSTOMER VISIT GRAPH */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#2d3748' }}>
             📈 Engagement Activity
          </h2>
          <VisitChart data={chartData} />
        </div>

        {/* 8. UI FOR ADMIN: RESET TABLE ACCESS */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#2d3748' }}>
             ⚙️ Operation Settings
          </h2>
          <div style={{ marginTop: '1rem', maxWidth: '400px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Reset Table Cooldown</label>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '1rem' }}>
              Manually clear a table's session to allow them to play the game again instantly.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Table Number (e.g. 5)"
                value={resetTableId}
                onChange={(e) => setResetTableId(e.target.value)}
                style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '1rem' }}
              />
              <button 
                onClick={handleResetTable}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Reset Table
              </button>
            </div>
            
            {resetMessage.text && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                fontSize: '0.9rem',
                backgroundColor: resetMessage.type === 'error' ? '#fff5f5' : resetMessage.type === 'loading' ? '#ebf8ff' : '#f0fff4',
                color: resetMessage.type === 'error' ? '#c53030' : resetMessage.type === 'loading' ? '#2b6cb0' : '#276749',
                border: `1px solid ${resetMessage.type === 'error' ? '#feb2b2' : resetMessage.type === 'loading' ? '#bee3f8' : '#c6f6d5'}`
              }}>
                {resetMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* CUSTOMER LIST TABLE */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#2d3748' }}>Customer Directory</h2>
          <CustomerTable customers={customers} />
        </div>
      </div>
    </div>
  );
}

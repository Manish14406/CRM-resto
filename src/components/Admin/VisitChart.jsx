import React from 'react';

/**
 * VisitChart Component
 * 
 * Purpose: Visualizes customer engagement over time without heavy third-party libraries.
 * 
 * --- COMMENTS EXPLAINING GRAPH ---
 * 1. HOW IT IS GENERATED:
 * We map through the clustered date array passed from AdminPage. We find the mathematically 
 * maximum visit count (`maxVisits`), and calculate each CSS bar's height as a raw percentage 
 * of that maximum: `(item.count / maxVisits) * 100%`.
 * 
 * 2. BUSINESS INSIGHTS:
 * By visualizing daily visits, restaurants can definitively track which days drive the most 
 * engagement (e.g., weekends vs weekdays), proving ROI on specific promotions or identifying 
 * slow periods that need marketing boosts.
 */
export default function VisitChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
        No recent visit data available.
      </div>
    );
  }

  // Find the highest count to scale the bars dynamically
  const maxVisits = Math.max(...data.map(d => d.count), 1); 

  return (
    <div style={{ padding: '1rem', overflowX: 'auto', backgroundColor: '#fafa2', borderRadius: '8px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        height: '250px', 
        gap: '20px', 
        minWidth: 'min-content', 
        paddingBottom: '2rem',
        paddingTop: '1rem',
        borderBottom: '2px solid #e2e8f0'
      }}>
        {data.map((item, index) => {
          // Height scale bounded to 90% purely for visual breathing room at the top of the chart 
          const heightPercent = `${(item.count / maxVisits) * 90}%`;
          
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '45px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2b6cb0', marginBottom: '8px' }}>
                {item.count}
              </span>
              
              <div 
                style={{ 
                  height: heightPercent, 
                  width: '100%', 
                  background: 'linear-gradient(180deg, #4299e1 0%, #3182ce 100%)', 
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px',
                  boxShadow: '0 2px 4px rgba(66, 153, 225, 0.4)',
                  transition: 'height 0.8s ease-out' 
                }} 
              />
              
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#718096', 
                marginTop: '12px', 
                transform: 'rotate(-45deg) translateX(-10px)', 
                whiteSpace: 'nowrap',
                fontWeight: '500'
              }}>
                {item.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

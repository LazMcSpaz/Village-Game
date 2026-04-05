import React, { useRef, useEffect } from 'react';

export default function CombatLog({ logs, combatActive, soldiers, enemies }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!combatActive && logs.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>⚔️ Combat Log</span>
        {combatActive && (
          <span style={styles.counts}>
            Soldiers: {soldiers.filter(s => s.hp > 0).length} vs Enemies: {enemies.filter(e => e.hp > 0).length}
          </span>
        )}
      </div>
      <div ref={logRef} style={styles.log}>
        {logs.map((entry, i) => (
          <div key={i} style={{
            ...styles.entry,
            color: entry.includes('fallen') || entry.includes('takes 1 damage')
              ? '#ff6b6b'
              : entry.includes('defeated') || entry.includes('killed')
                ? '#51cf66'
                : entry.includes('retreats')
                  ? '#ffd43b'
                  : entry.includes('ROUND') || entry.includes('RAID')
                    ? '#74c0fc'
                    : '#ccc',
            fontWeight: entry.includes('ROUND') || entry.includes('RAID') || entry.includes('VICTORY') || entry.includes('DEFEAT')
              ? 'bold' : 'normal',
          }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    right: '10px',
    top: '60px',
    width: '340px',
    maxHeight: 'calc(100vh - 160px)',
    background: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid #8B6914',
    borderRadius: '8px',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #8B6914',
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  counts: {
    fontSize: '12px',
    color: '#f0d48a',
  },
  log: {
    padding: '8px',
    overflowY: 'auto',
    maxHeight: '400px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  entry: {
    padding: '2px 0',
    borderBottom: '1px solid rgba(139, 105, 20, 0.2)',
  },
};

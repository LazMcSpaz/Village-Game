import React, { useRef, useEffect } from 'react';

export default function CombatLog({ logs, combatActive, soldiers, enemies, onClose }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (!combatActive && logs.length === 0) return null;

  const aliveS = soldiers.filter(s => s.hp > 0).length;
  const aliveE = enemies.filter(e => e.hp > 0).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>⚔️</span>
          <span>Combat</span>
        </div>
        <div style={styles.headerRight}>
          {combatActive && (
            <div style={styles.counts}>
              <span style={styles.countBlue}>{aliveS}</span>
              <span style={styles.countVs}>vs</span>
              <span style={styles.countRed}>{aliveE}</span>
            </div>
          )}
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
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
                    : '#aaa',
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
    top: '10px',
    width: '320px',
    maxHeight: 'calc(100vh - 130px)',
    background: 'rgba(10, 6, 2, 0.9)',
    border: '1px solid rgba(139, 105, 20, 0.4)',
    borderRadius: '8px',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(4px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderBottom: '1px solid rgba(139, 105, 20, 0.3)',
    color: '#e8d5a0',
    fontWeight: '600',
    fontSize: '13px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  headerIcon: {
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  counts: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  countBlue: {
    color: '#6699ff',
  },
  countVs: {
    color: '#666',
    fontSize: '10px',
    fontWeight: 'normal',
  },
  countRed: {
    color: '#ff5555',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid rgba(139, 105, 20, 0.3)',
    borderRadius: '4px',
    color: '#8a7a60',
    width: 22,
    height: 22,
    cursor: 'pointer',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  log: {
    padding: '6px 8px',
    overflowY: 'auto',
    maxHeight: '350px',
    fontSize: '11px',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    lineHeight: 1.5,
  },
  entry: {
    padding: '1px 0',
  },
};

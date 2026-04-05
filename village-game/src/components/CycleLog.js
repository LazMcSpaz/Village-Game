import React, { useRef, useEffect } from 'react';

export default function CycleLog({ logs, onClose }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>📜 Cycle Log</span>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div ref={logRef} style={styles.log}>
        {logs.map((entry, i) => (
          <div key={i} style={{
            ...styles.entry,
            color: entry.includes('Morale') || entry.includes('died')
              ? '#ff6b6b'
              : entry.includes('produced')
                ? '#51cf66'
                : '#ccc',
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
    left: '10px',
    top: '60px',
    width: '300px',
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
  closeBtn: {
    background: 'none',
    border: '1px solid #8B6914',
    borderRadius: '50%',
    color: '#f0d48a',
    width: 24,
    height: 24,
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  log: {
    padding: '8px',
    overflowY: 'auto',
    maxHeight: '300px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  entry: {
    padding: '2px 0',
    borderBottom: '1px solid rgba(139, 105, 20, 0.2)',
  },
};

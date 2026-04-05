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
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>📜</span>
          <span>Log</span>
        </div>
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
                : entry.includes('CYCLE')
                  ? '#74c0fc'
                  : '#aaa',
            fontWeight: entry.includes('CYCLE') ? 'bold' : 'normal',
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
    top: '10px',
    width: '280px',
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
    maxHeight: '250px',
    fontSize: '11px',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    lineHeight: 1.5,
  },
  entry: {
    padding: '1px 0',
  },
};

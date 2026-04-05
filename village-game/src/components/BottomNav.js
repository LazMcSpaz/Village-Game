import React from 'react';

export default function BottomNav({ currentMenu, onNavigate, onAdvanceCycle, canAdvance, gamePhase }) {
  return (
    <div style={styles.bar}>
      <div style={styles.breadcrumb}>
        <button style={styles.breadcrumbBtn} onClick={() => onNavigate([])}>
          Village
        </button>
        {currentMenu.map((item, i) => (
          <span key={i}>
            <span style={styles.arrow}> → </span>
            <button
              style={styles.breadcrumbBtn}
              onClick={() => onNavigate(currentMenu.slice(0, i + 1))}
            >
              {item}
            </button>
          </span>
        ))}
      </div>
      <div style={styles.actions}>
        {currentMenu.length === 0 && (
          <button style={styles.menuBtn} onClick={() => onNavigate(['Buildings'])}>
            Buildings
          </button>
        )}
        {currentMenu.length === 1 && currentMenu[0] === 'Buildings' && (
          <button style={styles.menuBtn} onClick={() => onNavigate(['Buildings', 'Barracks'])}>
            Barracks
          </button>
        )}
        <button
          style={{
            ...styles.advanceBtn,
            opacity: canAdvance ? 1 : 0.5,
          }}
          onClick={onAdvanceCycle}
          disabled={!canAdvance}
        >
          {gamePhase === 'idle' ? 'Next Cycle ▶' : gamePhase === 'combat' ? '⚔️ Combat...' : 'Processing...'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(0deg, #2a1a0e, #3d2816)',
    borderTop: '3px solid #8B6914',
    padding: '8px 16px',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '40px',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    color: '#f0d48a',
    fontSize: '14px',
  },
  breadcrumbBtn: {
    background: 'none',
    border: 'none',
    color: '#f0d48a',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    padding: '4px 8px',
    textDecoration: 'underline',
  },
  arrow: {
    color: '#8B6914',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  menuBtn: {
    background: '#5a3a1e',
    border: '2px solid #8B6914',
    borderRadius: '8px',
    color: '#f0d48a',
    padding: '6px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  advanceBtn: {
    background: '#1a6b1a',
    border: '2px solid #2ecc40',
    borderRadius: '8px',
    color: '#fff',
    padding: '6px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
  },
};

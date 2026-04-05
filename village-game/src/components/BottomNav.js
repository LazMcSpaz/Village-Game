import React from 'react';

export default function BottomNav({ currentMenu, onNavigate, onAdvanceCycle, canAdvance, gamePhase }) {
  const isBuildings = currentMenu.length >= 1 && currentMenu[0] === 'Buildings';
  const isBarracks = currentMenu.length === 2 && currentMenu[1] === 'Barracks';

  return (
    <div style={styles.bar}>
      {/* Left: Menu buttons */}
      <div style={styles.menuGroup}>
        {!isBuildings && (
          <button
            style={styles.menuBtn}
            onClick={() => onNavigate(['Buildings'])}
          >
            <span style={styles.menuIcon}>🏗️</span>
            <span style={styles.menuLabel}>Buildings</span>
          </button>
        )}

        {isBuildings && !isBarracks && (
          <>
            <button
              style={styles.backBtn}
              onClick={() => onNavigate([])}
            >
              ‹
            </button>
            <button
              style={styles.menuBtn}
              onClick={() => onNavigate(['Buildings', 'Barracks'])}
            >
              <span style={styles.menuIcon}>🏰</span>
              <span style={styles.menuLabel}>Barracks</span>
            </button>
          </>
        )}

        {isBarracks && (
          <button
            style={styles.backBtn}
            onClick={() => onNavigate(['Buildings'])}
          >
            ‹ Back
          </button>
        )}
      </div>

      {/* Right: Next Cycle */}
      <button
        style={{
          ...styles.cycleBtn,
          ...(canAdvance ? {} : styles.cycleBtnDisabled),
        }}
        onClick={onAdvanceCycle}
        disabled={!canAdvance}
      >
        {gamePhase === 'idle' ? (
          <>
            <span style={styles.cycleLabel}>Next Cycle</span>
            <span style={styles.cycleArrow}>▶</span>
          </>
        ) : gamePhase === 'combat' ? (
          <>
            <span style={styles.combatPulse}>⚔️</span>
            <span style={styles.cycleLabel}>Combat...</span>
          </>
        ) : (
          <span style={styles.cycleLabel}>Processing...</span>
        )}
      </button>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(0deg, #1a0e05 0%, #2a1a0e 40%, #342010 100%)',
    borderTop: '2px solid #6b5020',
    padding: '0 12px',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '52px',
  },
  menuGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(139, 105, 20, 0.2)',
    border: '1px solid #6b5020',
    borderRadius: '6px',
    color: '#e8d5a0',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.15s',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: '1px solid rgba(139, 105, 20, 0.4)',
    borderRadius: '6px',
    color: '#a89060',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  menuIcon: {
    fontSize: '16px',
    lineHeight: 1,
  },
  menuLabel: {
    lineHeight: 1,
  },
  cycleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(180deg, #2a7a2a, #1a5a1a)',
    border: '1px solid #3a9a3a',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(42, 122, 42, 0.3)',
  },
  cycleBtnDisabled: {
    opacity: 0.4,
    cursor: 'default',
    boxShadow: 'none',
  },
  cycleLabel: {
    lineHeight: 1,
  },
  cycleArrow: {
    fontSize: '12px',
    opacity: 0.8,
  },
  combatPulse: {
    animation: 'pulse 1s infinite',
  },
};

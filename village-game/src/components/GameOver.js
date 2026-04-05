import React from 'react';

export default function GameOver({ cycle, onRestart }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <h1 style={styles.title}>GAME OVER</h1>
        <div style={styles.skull}>💀</div>
        <p style={styles.text}>Your village's morale has collapsed.</p>
        <p style={styles.text}>The villagers have fled in despair.</p>
        <div style={styles.stat}>
          <span>Cycles Survived:</span>
          <span style={styles.value}>{cycle}</span>
        </div>
        <button style={styles.btn} onClick={onRestart}>
          Try Again
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: 'linear-gradient(180deg, #2a1a0e, #1a0e00)',
    border: '3px solid #8B1A1A',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    color: '#f0d48a',
    maxWidth: '400px',
  },
  title: {
    color: '#ff4444',
    fontSize: '36px',
    margin: '0 0 10px 0',
    textShadow: '2px 2px 4px rgba(255,0,0,0.5)',
  },
  skull: {
    fontSize: '64px',
    margin: '10px 0',
  },
  text: {
    margin: '8px 0',
    fontSize: '16px',
  },
  stat: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    margin: '20px 0',
    fontSize: '20px',
  },
  value: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  btn: {
    marginTop: '16px',
    background: '#5a3a1e',
    border: '2px solid #8B6914',
    borderRadius: '8px',
    color: '#f0d48a',
    padding: '12px 32px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '18px',
  },
};

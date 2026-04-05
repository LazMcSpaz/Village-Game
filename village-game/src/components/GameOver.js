import React from 'react';

export default function GameOver({ cycle, onRestart }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.skull}>💀</div>
        <h1 style={styles.title}>GAME OVER</h1>
        <p style={styles.text}>Your village's morale has collapsed.</p>
        <p style={styles.textSub}>The villagers have fled in despair.</p>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>Cycles Survived</span>
          <span style={styles.statValue}>{cycle}</span>
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
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: 'rgba(10, 6, 2, 0.98)',
    border: '1px solid rgba(180, 30, 30, 0.4)',
    borderRadius: '12px',
    padding: '40px 50px',
    textAlign: 'center',
    color: '#e8d5a0',
    maxWidth: '360px',
  },
  skull: {
    fontSize: '48px',
    marginBottom: '8px',
    opacity: 0.9,
  },
  title: {
    color: '#cc3333',
    fontSize: '28px',
    margin: '0 0 16px 0',
    fontWeight: '700',
    letterSpacing: '3px',
  },
  text: {
    margin: '6px 0',
    fontSize: '14px',
    color: '#bbb',
  },
  textSub: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#777',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '24px 0',
    padding: '12px',
    background: 'rgba(139, 105, 20, 0.1)',
    border: '1px solid rgba(139, 105, 20, 0.3)',
    borderRadius: '8px',
  },
  statLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#8a7a60',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#f0d48a',
  },
  btn: {
    background: 'linear-gradient(180deg, #2a7a2a, #1a5a1a)',
    border: '1px solid #3a9a3a',
    borderRadius: '6px',
    color: '#fff',
    padding: '12px 32px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
};

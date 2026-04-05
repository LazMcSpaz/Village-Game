import React from 'react';

export default function ResourceBar({ resources, cycle }) {
  return (
    <div style={styles.bar}>
      <div style={styles.item}>
        <span style={styles.icon}>&#x1FA99;</span>
        <span style={styles.label}>Gold: {resources.gold}</span>
      </div>
      <div style={styles.item}>
        <span style={styles.icon}>&#x1F356;</span>
        <span style={styles.label}>Food: {resources.food}</span>
      </div>
      <div style={styles.item}>
        <span style={styles.icon}>&#x1FAB5;</span>
        <span style={styles.label}>Materials: {resources.buildingMaterials}</span>
      </div>
      <div style={styles.item}>
        <span style={styles.icon}>&#x1F49B;</span>
        <span style={styles.label}>Morale: {resources.morale}</span>
      </div>
      <div style={styles.cycle}>
        Cycle: {cycle}
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    background: 'linear-gradient(180deg, #2a1a0e, #3d2816)',
    borderBottom: '3px solid #8B6914',
    padding: '8px 16px',
    color: '#f0d48a',
    fontFamily: '"Segoe UI", sans-serif',
    fontWeight: 'bold',
    fontSize: '14px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '36px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  icon: {
    fontSize: '18px',
  },
  label: {},
  cycle: {
    background: '#8B6914',
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#1a0e00',
    fontSize: '13px',
  },
};

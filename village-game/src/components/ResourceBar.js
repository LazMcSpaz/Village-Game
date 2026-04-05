import React from 'react';

function ResourceItem({ icon, value, label, color }) {
  return (
    <div style={styles.item}>
      <span style={styles.icon}>{icon}</span>
      <div style={styles.itemText}>
        <span style={{ ...styles.value, color: color || '#fff' }}>{value}</span>
        <span style={styles.label}>{label}</span>
      </div>
    </div>
  );
}

export default function ResourceBar({ resources, cycle }) {
  return (
    <div style={styles.bar}>
      <div style={styles.resources}>
        <ResourceItem icon="🪙" value={resources.gold} label="Gold" color="#ffd700" />
        <div style={styles.divider} />
        <ResourceItem icon="🍖" value={resources.food} label="Food" color="#ff9966" />
        <div style={styles.divider} />
        <ResourceItem icon="🪵" value={resources.buildingMaterials} label="Materials" color="#c4a46c" />
        <div style={styles.divider} />
        <ResourceItem
          icon="💛"
          value={resources.morale}
          label="Morale"
          color={resources.morale <= 15 ? '#ff4444' : resources.morale <= 30 ? '#ffa500' : '#66ff66'}
        />
      </div>
      <div style={styles.cycleBox}>
        <span style={styles.cycleLabel}>Cycle</span>
        <span style={styles.cycleNum}>{cycle}</span>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, #342010 0%, #2a1a0e 60%, #1a0e05 100%)',
    borderBottom: '2px solid #6b5020',
    padding: '0 16px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '48px',
  },
  resources: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
  },
  icon: {
    fontSize: '16px',
    lineHeight: 1,
  },
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1,
  },
  value: {
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: 1.2,
  },
  label: {
    fontSize: '9px',
    color: '#8a7a60',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: 1.2,
  },
  divider: {
    width: 1,
    height: 24,
    background: 'rgba(139, 105, 20, 0.3)',
  },
  cycleBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(139, 105, 20, 0.15)',
    border: '1px solid rgba(139, 105, 20, 0.4)',
    borderRadius: '6px',
    padding: '4px 14px',
    lineHeight: 1,
  },
  cycleLabel: {
    fontSize: '9px',
    color: '#8a7a60',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: 1.2,
  },
  cycleNum: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#f0d48a',
    lineHeight: 1.2,
  },
};

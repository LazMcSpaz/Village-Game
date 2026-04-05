import React from 'react';
import { BARRACKS_BUILD_COST, SOLDIER_UPKEEP_COST, SOLDIER_PRODUCTION_COST } from '../game/constants';

export default function BarracksMenu({ barracks, soldiers, resources, onBuild, onSetDesiredOutput, onSetMaxCap, onClose }) {
  if (!barracks.built) {
    const affordable = resources.buildingMaterials >= BARRACKS_BUILD_COST;
    return (
      <div style={styles.panel}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 style={styles.title}>Barracks</h2>
        <p style={styles.text}>The barracks is not yet built.</p>
        <p style={styles.text}>Cost: {BARRACKS_BUILD_COST} building materials</p>
        <button
          style={{ ...styles.buildBtn, opacity: affordable ? 1 : 0.5 }}
          onClick={onBuild}
          disabled={!affordable}
        >
          Build Barracks
        </button>
      </div>
    );
  }

  const currentCount = soldiers.length;
  const upkeepGold = currentCount * SOLDIER_UPKEEP_COST.gold;
  const upkeepFood = currentCount * SOLDIER_UPKEEP_COST.food;

  // Calculate affordable production
  const maxFromCap = barracks.maxArmyCap - currentCount;
  const maxFromDesired = barracks.desiredOutput;
  const maxFromResources = Math.min(
    Math.floor(resources.gold / SOLDIER_PRODUCTION_COST.gold),
    Math.floor(resources.food / SOLDIER_PRODUCTION_COST.food)
  );
  const affordableProduction = Math.max(0, Math.min(5, maxFromCap, maxFromDesired, maxFromResources));

  return (
    <div style={styles.panel}>
      <button style={styles.closeBtn} onClick={onClose}>✕</button>
      <h2 style={styles.title}>Barracks</h2>

      <div style={styles.stat}>
        <span>Soldiers:</span>
        <span style={styles.value}>{currentCount} / {barracks.maxArmyCap}</span>
      </div>

      <div style={styles.stat}>
        <span>Current Upkeep:</span>
        <span style={styles.value}>{upkeepGold} gold + {upkeepFood} food / cycle</span>
      </div>

      <div style={styles.stat}>
        <span>Affordable Production:</span>
        <span style={styles.value}>{affordableProduction} soldiers</span>
      </div>

      <div style={styles.control}>
        <label style={styles.label}>Desired Production (0–5):</label>
        <input
          type="range"
          min={0}
          max={5}
          value={barracks.desiredOutput}
          onChange={(e) => onSetDesiredOutput(Number(e.target.value))}
          style={styles.slider}
        />
        <span style={styles.sliderVal}>{barracks.desiredOutput}</span>
      </div>

      <div style={styles.control}>
        <label style={styles.label}>Max Army Cap (0–20):</label>
        <input
          type="range"
          min={0}
          max={20}
          value={barracks.maxArmyCap}
          onChange={(e) => onSetMaxCap(Number(e.target.value))}
          style={styles.slider}
        />
        <span style={styles.sliderVal}>{barracks.maxArmyCap}</span>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: 'relative',
    background: 'rgba(10, 6, 2, 0.95)',
    border: '1px solid rgba(139, 105, 20, 0.4)',
    borderRadius: '10px',
    padding: '20px',
    color: '#e8d5a0',
    maxWidth: '380px',
    margin: '0 auto',
    backdropFilter: 'blur(4px)',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: 'none',
    border: '1px solid rgba(139, 105, 20, 0.3)',
    borderRadius: '4px',
    color: '#8a7a60',
    width: 24,
    height: 24,
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  title: {
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#e8d5a0',
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  text: {
    textAlign: 'center',
    margin: '8px 0',
    fontSize: '13px',
    color: '#aaa',
  },
  buildBtn: {
    display: 'block',
    margin: '16px auto 0',
    background: 'linear-gradient(180deg, #2a7a2a, #1a5a1a)',
    border: '1px solid #3a9a3a',
    borderRadius: '6px',
    color: '#fff',
    padding: '10px 24px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(139, 105, 20, 0.15)',
    fontSize: '13px',
  },
  value: {
    fontWeight: 'bold',
    color: '#f0d48a',
  },
  control: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    flex: '1',
  },
  slider: {
    width: '100px',
    accentColor: '#8B6914',
  },
  sliderVal: {
    fontWeight: 'bold',
    color: '#ffd700',
    minWidth: '20px',
    textAlign: 'center',
  },
};

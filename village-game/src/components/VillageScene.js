import React, { useRef, useEffect, useState } from 'react';

// Simple sprite component for soldiers walking
function SoldierSprite({ index, total, isEnemy }) {
  const [frame, setFrame] = useState(0);
  const baseX = isEnemy
    ? 700 + (index * 40) % 300
    : 50 + (index * 50) % 500;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 300 + Math.random() * 200);
    return () => clearInterval(interval);
  }, []);

  const bobY = frame % 2 === 0 ? 0 : -2;

  return (
    <div style={{
      position: 'absolute',
      bottom: 20 + (index % 3) * 15,
      left: baseX,
      transform: `translateY(${bobY}px) scaleX(${isEnemy ? -1 : 1})`,
      transition: 'transform 0.15s',
      fontSize: '10px',
      lineHeight: '1.1',
      fontFamily: 'monospace',
      color: isEnemy ? '#ff4444' : '#4488ff',
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      whiteSpace: 'pre',
      textAlign: 'center',
    }}>
      <div>{isEnemy ? '👹' : '⚔️'}</div>
      <div style={{ fontSize: '16px' }}>{isEnemy ? '🧟' : '🧑‍🌾'}</div>
    </div>
  );
}

function Building({ type, x }) {
  const buildings = {
    house: { emoji: '🏠', label: 'House', width: 50 },
    barracks: { emoji: '🏰', label: 'Barracks', width: 60 },
    tavern: { emoji: '🍺', label: 'Tavern', width: 50 },
    market: { emoji: '🏪', label: 'Market', width: 50 },
    farm: { emoji: '🌾', label: 'Farm', width: 50 },
  };

  const b = buildings[type] || buildings.house;

  return (
    <div style={{
      position: 'absolute',
      bottom: 55,
      left: x,
      textAlign: 'center',
      fontSize: '36px',
    }}>
      <div>{b.emoji}</div>
      <div style={{
        fontSize: '9px',
        color: '#f0d48a',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        fontWeight: 'bold',
      }}>{b.label}</div>
    </div>
  );
}

export default function VillageScene({ soldiers, enemies, barracksBuilt, combatActive }) {
  const sceneRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);

  // Auto-scroll slightly based on soldier count
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollX(x => {
        const maxScroll = Math.max(0, (soldiers.length * 50 + 300) - 800);
        return x < maxScroll ? x + 0.5 : 0;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [soldiers.length]);

  const buildingList = [
    { type: 'house', x: 30 },
    { type: 'farm', x: 130 },
    { type: 'market', x: 250 },
    { type: 'tavern', x: 380 },
  ];
  if (barracksBuilt) {
    buildingList.push({ type: 'barracks', x: 500 });
  }

  return (
    <div style={styles.sceneContainer}>
      <div
        ref={sceneRef}
        style={{
          ...styles.scene,
          transform: `translateX(-${scrollX}px)`,
        }}
      >
        {/* Sky gradient */}
        <div style={styles.sky} />

        {/* Mountains */}
        <div style={styles.mountains}>
          {'⛰️ '.repeat(8)}
        </div>

        {/* Trees */}
        <div style={styles.trees}>
          {'🌲 '.repeat(15)}
        </div>

        {/* Buildings */}
        {buildingList.map((b, i) => (
          <Building key={i} type={b.type} x={b.x} />
        ))}

        {/* Ground */}
        <div style={styles.ground} />

        {/* Soldier sprites */}
        {soldiers.map((s, i) => (
          <SoldierSprite key={`s-${s.id}`} index={i} total={soldiers.length} isEnemy={false} />
        ))}

        {/* Enemy sprites during combat */}
        {enemies.map((e, i) => (
          <SoldierSprite key={`e-${e.id}`} index={i} total={enemies.length} isEnemy={true} />
        ))}

        {/* Combat indicator */}
        {combatActive && (
          <div style={styles.combatBanner}>
            ⚔️ RAID IN PROGRESS ⚔️
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  sceneContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  scene: {
    position: 'relative',
    width: '1200px',
    height: '100%',
    transition: 'transform 0.5s linear',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #1a0533 0%, #2d1b4e 30%, #4a2d6e 50%, #6b4d8e 70%, #c9a96e 90%, #5a8a3c 95%)',
  },
  mountains: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    fontSize: '28px',
    letterSpacing: '8px',
    opacity: 0.6,
  },
  trees: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    fontSize: '24px',
    letterSpacing: '4px',
    opacity: 0.8,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50px',
    background: 'linear-gradient(180deg, #5a8a3c, #3d6b2e)',
    borderTop: '2px solid #4a7a34',
  },
  combatBanner: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(180, 0, 0, 0.85)',
    color: '#fff',
    padding: '8px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '18px',
    border: '2px solid #ff4444',
    animation: 'pulse 1s infinite',
    zIndex: 10,
  },
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import SpriteSheet from './SpriteSheet';

// Environment assets
import skyImg from '../assets/environment/sky.png';
import mountainsImg from '../assets/environment/mountains.png';
import groundImg from '../assets/environment/ground.png';
import treeImg from '../assets/environment/tree.png';
import battleArrowRight from '../assets/environment/battle-arrow-right.png';
import battleArrowLeft from '../assets/environment/battle-arrow-left.png';

// Building assets
import barracksImg from '../assets/buildings/barracks.png';
import houseImg from '../assets/buildings/house.png';
import marketImg from '../assets/buildings/market.png';
import tavernImg from '../assets/buildings/tavern.png';
import farmImg from '../assets/buildings/farm.png';

// Character sprite sheets
import soldierIdle from '../assets/characters/soldier/Soldier-Idle.png';
import soldierWalk from '../assets/characters/soldier/Soldier-Walk.png';
import soldierAttack from '../assets/characters/soldier/Soldier-Attack01.png';
import soldierHurt from '../assets/characters/soldier/Soldier-Hurt.png';
import soldierDeath from '../assets/characters/soldier/Soldier-Death.png';

import orcIdle from '../assets/characters/orc/Orc-Idle.png';
import orcWalk from '../assets/characters/orc/Orc-Walk.png';
import orcAttack from '../assets/characters/orc/Orc-Attack01.png';
import orcHurt from '../assets/characters/orc/Orc-Hurt.png';
import orcDeath from '../assets/characters/orc/Orc-Death.png';

// Scene dimensions
const WORLD_WIDTH = 1600;
const GROUND_HEIGHT = 64;
// Building definitions positioned in the world
const BUILDING_DEFS = [
  { type: 'house', img: houseImg, x: 80, w: 80, h: 72 },
  { type: 'farm', img: farmImg, x: 220, w: 100, h: 64 },
  { type: 'market', img: marketImg, x: 400, w: 90, h: 70 },
  { type: 'tavern', img: tavernImg, x: 560, w: 90, h: 80 },
];

const BARRACKS_DEF = { type: 'barracks', img: barracksImg, x: 740, w: 128, h: 96 };

// Tree positions
const TREE_POSITIONS = [30, 170, 340, 510, 680, 870, 1000, 1130, 1280, 1420];

// Sprite config
const SPRITE_SCALE = 1.5;
const FRAME_SIZE = 100;

// Soldier sprite data
const SOLDIER_ANIMS = {
  idle: { src: soldierIdle, frames: 6, fps: 6 },
  walk: { src: soldierWalk, frames: 8, fps: 10 },
  attack: { src: soldierAttack, frames: 6, fps: 8 },
  hurt: { src: soldierHurt, frames: 4, fps: 6 },
  death: { src: soldierDeath, frames: 4, fps: 4 },
};

const ORC_ANIMS = {
  idle: { src: orcIdle, frames: 6, fps: 6 },
  walk: { src: orcWalk, frames: 8, fps: 10 },
  attack: { src: orcAttack, frames: 6, fps: 8 },
  hurt: { src: orcHurt, frames: 4, fps: 6 },
  death: { src: orcDeath, frames: 4, fps: 4 },
};

// Character component with walking movement
function Character({ id, isEnemy, baseX, anim, scale }) {
  const animData = isEnemy ? ORC_ANIMS[anim] : SOLDIER_ANIMS[anim];
  const [walkOffset, setWalkOffset] = useState(0);
  const dirRef = useRef(isEnemy ? -1 : 1);

  useEffect(() => {
    if (anim !== 'idle') return;
    // Soldiers patrol back and forth
    const interval = setInterval(() => {
      setWalkOffset(prev => {
        const next = prev + dirRef.current * 0.5;
        if (Math.abs(next) > 30) {
          dirRef.current *= -1;
          return prev + dirRef.current * 0.5;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [anim]);

  const facing = isEnemy ? true : (dirRef.current < 0);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: GROUND_HEIGHT - 8,
        left: baseX + walkOffset,
        zIndex: 20,
      }}
    >
      <SpriteSheet
        src={animData.src}
        frameWidth={FRAME_SIZE}
        frameHeight={FRAME_SIZE}
        frameCount={animData.frames}
        fps={animData.fps}
        scale={scale}
        flipX={facing}
        loop={anim !== 'death'}
      />
    </div>
  );
}

export default function VillageScene({ soldiers, enemies, barracksBuilt, combatActive }) {
  const containerRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollStart = useRef(0);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const maxScroll = Math.max(0, WORLD_WIDTH - containerWidth);

  const clampScroll = useCallback((val) => {
    return Math.max(0, Math.min(val, maxScroll));
  }, [maxScroll]);

  // Mouse/touch scroll
  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    dragScrollStart.current = scrollX;
    e.preventDefault();
  }, [scrollX]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const delta = dragStartX.current - clientX;
    setScrollX(clampScroll(dragScrollStart.current + delta));
  }, [clampScroll]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Wheel scroll
  const handleWheel = useCallback((e) => {
    setScrollX(prev => clampScroll(prev + e.deltaX + e.deltaY));
  }, [clampScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Calculate soldier positions - spread across village area
  const soldierPositions = soldiers.map((s, i) => {
    const spacing = 60;
    const startX = 100;
    return startX + (i * spacing) % 600;
  });

  // Calculate enemy positions - they come from the right
  const combatZoneX = 900;
  const enemyPositions = enemies.map((e, i) => {
    return combatZoneX + i * 55;
  });

  // Determine if battle is off-screen
  const battleMinX = combatActive && enemies.length > 0
    ? Math.min(...enemyPositions, ...soldierPositions.slice(0, soldiers.length))
    : 0;
  const battleMaxX = combatActive && enemies.length > 0
    ? Math.max(...enemyPositions)
    : 0;

  const battleOffRight = combatActive && enemies.length > 0 && battleMaxX > scrollX + containerWidth;
  const battleOffLeft = combatActive && enemies.length > 0 && battleMinX < scrollX;

  // Scroll to battle helper
  const scrollToBattle = useCallback((direction) => {
    if (direction === 'right') {
      setScrollX(clampScroll(battleMaxX - containerWidth + 100));
    } else {
      setScrollX(clampScroll(battleMinX - 100));
    }
  }, [battleMaxX, battleMinX, containerWidth, clampScroll]);

  // Get buildings list
  const buildings = [...BUILDING_DEFS];
  if (barracksBuilt) {
    buildings.push(BARRACKS_DEF);
  }

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* === PARALLAX LAYERS === */}

      {/* Sky - fixed background */}
      <div style={{
        ...styles.layer,
        backgroundImage: `url(${skyImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0,
      }} />

      {/* Mountains - slow parallax */}
      <div style={{
        ...styles.layer,
        bottom: GROUND_HEIGHT - 10,
        height: 200,
        top: 'auto',
        backgroundImage: `url(${mountainsImg})`,
        backgroundSize: 'auto 100%',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: `${-scrollX * 0.2}px bottom`,
        zIndex: 1,
      }} />

      {/* Trees - medium parallax */}
      <div style={{
        ...styles.layer,
        zIndex: 2,
        transform: `translateX(${-scrollX * 0.5}px)`,
      }}>
        {TREE_POSITIONS.map((tx, i) => (
          <img
            key={i}
            src={treeImg}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              bottom: GROUND_HEIGHT - 4,
              left: tx,
              width: 48,
              height: 80,
              imageRendering: 'pixelated',
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* === MAIN WORLD LAYER (scrolls 1:1) === */}
      <div style={{
        ...styles.layer,
        transform: `translateX(${-scrollX}px)`,
        width: WORLD_WIDTH,
        zIndex: 5,
      }}>
        {/* Buildings */}
        {buildings.map((b, i) => (
          <img
            key={b.type + i}
            src={b.img}
            alt={b.type}
            draggable={false}
            style={{
              position: 'absolute',
              bottom: GROUND_HEIGHT - 4,
              left: b.x,
              width: b.w,
              height: b.h,
              imageRendering: 'pixelated',
              zIndex: 10,
            }}
          />
        ))}

        {/* Soldiers */}
        {soldiers.map((s, i) => (
          <Character
            key={`s-${s.id}`}
            id={s.id}
            isEnemy={false}
            baseX={soldierPositions[i] || 100}
            anim={combatActive ? 'idle' : 'idle'}
            scale={SPRITE_SCALE}
          />
        ))}

        {/* Enemies */}
        {enemies.map((e, i) => (
          <Character
            key={`e-${e.id}`}
            id={e.id}
            isEnemy={true}
            baseX={enemyPositions[i] || combatZoneX}
            anim={combatActive ? 'idle' : 'idle'}
            scale={SPRITE_SCALE}
          />
        ))}

        {/* Combat zone indicator */}
        {combatActive && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: combatZoneX - 50,
            width: enemies.length * 55 + 100,
            textAlign: 'center',
            zIndex: 30,
          }}>
            <div style={styles.combatBanner}>
              RAID IN PROGRESS
            </div>
          </div>
        )}
      </div>

      {/* Ground - repeating tile, scrolls 1:1 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: GROUND_HEIGHT,
        backgroundImage: `url(${groundImg})`,
        backgroundSize: '64px 64px',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: `${-scrollX}px top`,
        imageRendering: 'pixelated',
        zIndex: 6,
      }} />

      {/* === OFF-SCREEN BATTLE ARROWS === */}
      {battleOffRight && (
        <div
          style={styles.arrowRight}
          onClick={() => scrollToBattle('right')}
        >
          <img
            src={battleArrowRight}
            alt="Battle this way"
            style={styles.arrowImg}
            draggable={false}
          />
          <div style={styles.arrowPulse} />
        </div>
      )}

      {battleOffLeft && (
        <div
          style={styles.arrowLeft}
          onClick={() => scrollToBattle('left')}
        >
          <img
            src={battleArrowLeft}
            alt="Battle this way"
            style={styles.arrowImg}
            draggable={false}
          />
          <div style={styles.arrowPulse} />
        </div>
      )}

      {/* Scroll position indicator */}
      <div style={styles.scrollBarTrack}>
        <div style={{
          ...styles.scrollBarThumb,
          width: `${(containerWidth / WORLD_WIDTH) * 100}%`,
          left: `${(scrollX / WORLD_WIDTH) * 100}%`,
        }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    cursor: 'grab',
    userSelect: 'none',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  combatBanner: {
    display: 'inline-block',
    background: 'rgba(180, 0, 0, 0.85)',
    color: '#fff',
    padding: '6px 20px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '16px',
    border: '2px solid #ff4444',
    letterSpacing: '2px',
    animation: 'pulse 1s infinite',
  },
  arrowRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    zIndex: 80,
    pointerEvents: 'auto',
    animation: 'bounceRight 1s infinite',
  },
  arrowLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    zIndex: 80,
    pointerEvents: 'auto',
    animation: 'bounceLeft 1s infinite',
  },
  arrowImg: {
    width: 64,
    height: 64,
    imageRendering: 'pixelated',
    filter: 'drop-shadow(0 0 8px rgba(255, 50, 50, 0.8))',
  },
  arrowPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    border: '2px solid rgba(255, 50, 50, 0.5)',
    borderRadius: '50%',
    animation: 'pulse 1s infinite',
  },
  scrollBarTrack: {
    position: 'absolute',
    bottom: 70,
    left: '10%',
    width: '80%',
    height: 4,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    zIndex: 70,
  },
  scrollBarThumb: {
    position: 'absolute',
    top: 0,
    height: '100%',
    background: 'rgba(240, 212, 138, 0.5)',
    borderRadius: 2,
  },
};

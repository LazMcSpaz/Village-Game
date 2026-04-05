import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
const SPRITE_BOTTOM = GROUND_HEIGHT - 8;

// Building definitions
const BUILDING_DEFS = [
  { type: 'house', img: houseImg, x: 80, w: 80, h: 72 },
  { type: 'farm', img: farmImg, x: 220, w: 100, h: 64 },
  { type: 'market', img: marketImg, x: 400, w: 90, h: 70 },
  { type: 'tavern', img: tavernImg, x: 560, w: 90, h: 80 },
];
const BARRACKS_DEF = { type: 'barracks', img: barracksImg, x: 740, w: 128, h: 96 };

const TREE_POSITIONS = [30, 170, 340, 510, 680, 870, 1000, 1130, 1280, 1420];

const SPRITE_SCALE = 1.5;
const FRAME_SIZE = 100;

// Combat positioning
const COMBAT_CENTER_X = 950;

const SOLDIER_ANIMS = {
  idle: { src: soldierIdle, frames: 6, fps: 6 },
  walk: { src: soldierWalk, frames: 8, fps: 10 },
  attack: { src: soldierAttack, frames: 6, fps: 8 },
  hurt: { src: soldierHurt, frames: 4, fps: 8 },
  death: { src: soldierDeath, frames: 4, fps: 4 },
};

const ORC_ANIMS = {
  idle: { src: orcIdle, frames: 6, fps: 6 },
  walk: { src: orcWalk, frames: 8, fps: 10 },
  attack: { src: orcAttack, frames: 6, fps: 8 },
  hurt: { src: orcHurt, frames: 4, fps: 8 },
  death: { src: orcDeath, frames: 4, fps: 4 },
};

// Individual character with position and animation
function Character({ x, anim, isEnemy, scale, flipOverride }) {
  const animData = isEnemy ? ORC_ANIMS[anim] : SOLDIER_ANIMS[anim];
  // Soldiers face right by default, orcs face left
  const flip = flipOverride !== undefined ? flipOverride : isEnemy;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: SPRITE_BOTTOM,
        left: x,
        zIndex: 20,
        transition: 'left 0.3s ease-out',
      }}
    >
      <SpriteSheet
        src={animData.src}
        frameWidth={FRAME_SIZE}
        frameHeight={FRAME_SIZE}
        frameCount={animData.frames}
        fps={animData.fps}
        scale={scale}
        flipX={flip}
        loop={anim !== 'death'}
      />
    </div>
  );
}

// Patrolling character for idle soldiers
function PatrolCharacter({ baseX, isEnemy, scale }) {
  const [walkOffset, setWalkOffset] = useState(0);
  const dirRef = useRef(1);

  useEffect(() => {
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
  }, []);

  return (
    <Character
      x={baseX + walkOffset}
      anim="idle"
      isEnemy={isEnemy}
      scale={scale}
      flipOverride={dirRef.current < 0}
    />
  );
}

export default function VillageScene({
  soldiers, enemies, barracksBuilt, combatActive,
  combatVisuals, // { phase, unitStates } from App
}) {
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

  const handleWheel = useCallback((e) => {
    setScrollX(prev => clampScroll(prev + e.deltaX + e.deltaY));
  }, [clampScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Idle soldier positions
  const idleSoldierPositions = useMemo(() => {
    return soldiers.map((s, i) => 100 + (i * 60) % 600);
  }, [soldiers]);

  // Determine combat area for off-screen arrows
  const combatAreaX = combatVisuals ? combatVisuals.unitStates : null;
  const allCombatX = useMemo(() => {
    if (!combatAreaX) return [];
    return combatAreaX.map(u => u.x);
  }, [combatAreaX]);

  const battleMinX = combatActive && allCombatX.length > 0 ? Math.min(...allCombatX) : 0;
  const battleMaxX = combatActive && allCombatX.length > 0 ? Math.max(...allCombatX) : 0;
  const battleOffRight = combatActive && allCombatX.length > 0 && battleMaxX > scrollX + containerWidth - 50;
  const battleOffLeft = combatActive && allCombatX.length > 0 && battleMinX < scrollX + 50;

  const scrollToBattle = useCallback((direction) => {
    if (direction === 'right') {
      setScrollX(clampScroll(battleMaxX - containerWidth + 150));
    } else {
      setScrollX(clampScroll(battleMinX - 150));
    }
  }, [battleMaxX, battleMinX, containerWidth, clampScroll]);

  // Auto-scroll to combat when it starts
  useEffect(() => {
    if (combatActive && combatVisuals && combatVisuals.phase === 'march') {
      setScrollX(clampScroll(COMBAT_CENTER_X - containerWidth / 2));
    }
  }, [combatActive, combatVisuals?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildings = [...BUILDING_DEFS];
  if (barracksBuilt) buildings.push(BARRACKS_DEF);

  // Determine what to render for characters
  const inCombat = combatActive && combatVisuals && combatVisuals.unitStates;

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
      {/* Sky */}
      <div style={{
        ...styles.layer,
        backgroundImage: `url(${skyImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0,
      }} />

      {/* Mountains - parallax */}
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

      {/* Trees - parallax */}
      <div style={{
        ...styles.layer,
        zIndex: 2,
        transform: `translateX(${-scrollX * 0.5}px)`,
      }}>
        {TREE_POSITIONS.map((tx, i) => (
          <img key={i} src={treeImg} alt="" draggable={false}
            style={{
              position: 'absolute', bottom: GROUND_HEIGHT - 4,
              left: tx, width: 48, height: 80,
              imageRendering: 'pixelated', opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Main world layer */}
      <div style={{
        ...styles.layer,
        transform: `translateX(${-scrollX}px)`,
        width: WORLD_WIDTH,
        zIndex: 5,
      }}>
        {/* Buildings */}
        {buildings.map((b, i) => (
          <img key={b.type + i} src={b.img} alt={b.type} draggable={false}
            style={{
              position: 'absolute', bottom: GROUND_HEIGHT - 4,
              left: b.x, width: b.w, height: b.h,
              imageRendering: 'pixelated', zIndex: 10,
            }}
          />
        ))}

        {/* === CHARACTERS === */}
        {inCombat ? (
          // Combat mode: render from visual state
          combatVisuals.unitStates.map((unit) => (
            <Character
              key={`${unit.side}-${unit.id}`}
              x={unit.x}
              anim={unit.anim}
              isEnemy={unit.side === 'enemy'}
              scale={SPRITE_SCALE}
              flipOverride={unit.side === 'enemy'}
            />
          ))
        ) : (
          // Idle mode: patrolling soldiers
          soldiers.map((s, i) => (
            <PatrolCharacter
              key={`s-${s.id}`}
              baseX={idleSoldierPositions[i] || 100}
              isEnemy={false}
              scale={SPRITE_SCALE}
            />
          ))
        )}

        {/* Combat banner */}
        {combatActive && combatVisuals && (
          <div style={{
            position: 'absolute', top: 10,
            left: COMBAT_CENTER_X - 120, width: 240,
            textAlign: 'center', zIndex: 30,
          }}>
            <div style={styles.combatBanner}>
              {combatVisuals.phase === 'march' ? 'ENEMIES APPROACHING' :
               combatVisuals.phase === 'fight' ? 'COMBAT' :
               combatVisuals.phase === 'resolve' ? 'RESOLVING...' : 'RAID IN PROGRESS'}
            </div>
          </div>
        )}
      </div>

      {/* Ground */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: GROUND_HEIGHT,
        backgroundImage: `url(${groundImg})`,
        backgroundSize: '64px 64px',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: `${-scrollX}px top`,
        imageRendering: 'pixelated',
        zIndex: 6,
      }} />

      {/* Off-screen battle arrows */}
      {battleOffRight && (
        <div style={styles.arrowRight} onClick={() => scrollToBattle('right')}>
          <img src={battleArrowRight} alt="Battle →" style={styles.arrowImg} draggable={false} />
        </div>
      )}
      {battleOffLeft && (
        <div style={styles.arrowLeft} onClick={() => scrollToBattle('left')}>
          <img src={battleArrowLeft} alt="← Battle" style={styles.arrowImg} draggable={false} />
        </div>
      )}

      {/* Scroll indicator */}
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
    top: 0, left: 0, right: 0, bottom: 0,
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
    right: 12, top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer', zIndex: 80,
    pointerEvents: 'auto',
    animation: 'bounceRight 1s infinite',
  },
  arrowLeft: {
    position: 'absolute',
    left: 12, top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer', zIndex: 80,
    pointerEvents: 'auto',
    animation: 'bounceLeft 1s infinite',
  },
  arrowImg: {
    width: 64, height: 64,
    imageRendering: 'pixelated',
    filter: 'drop-shadow(0 0 8px rgba(255, 50, 50, 0.8))',
  },
  scrollBarTrack: {
    position: 'absolute',
    bottom: 8, left: '10%', width: '80%', height: 4,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 2, zIndex: 70,
  },
  scrollBarThumb: {
    position: 'absolute', top: 0, height: '100%',
    background: 'rgba(240, 212, 138, 0.5)',
    borderRadius: 2,
  },
};

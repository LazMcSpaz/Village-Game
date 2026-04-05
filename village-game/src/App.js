import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import ResourceBar from './components/ResourceBar';
import BottomNav from './components/BottomNav';
import BarracksMenu from './components/BarracksMenu';
import VillageScene from './components/VillageScene';
import CombatLog from './components/CombatLog';
import CycleLog from './components/CycleLog';
import GameOver from './components/GameOver';
import { STARTING_RESOURCES, BARRACKS_BUILD_COST, ENEMY_KILL_REWARD, ENEMY_BREAKTHROUGH_PENALTY } from './game/constants';
import { spendResources, clampMorale } from './game/resources';
import { productionPhase, upkeepPhase } from './game/cycle';
import { resolveRound, generateRaid } from './game/combat';

// Visual combat timing (ms)
const MARCH_DURATION = 2000;
const FIGHT_ANIM_DURATION = 1500;
const DEATH_ANIM_DURATION = 1200;
const ROUND_PAUSE = 1000;

// Combat positioning
const COMBAT_CENTER_X = 950;
const COMBAT_ZONE_HALF = 180; // half-width of the melee zone

const INITIAL_BARRACKS = {
  built: false,
  desiredOutput: 2,
  maxArmyCap: 10,
};

function initialState() {
  return {
    resources: { ...STARTING_RESOURCES },
    soldiers: [],
    barracks: { ...INITIAL_BARRACKS },
    cycle: 0,
    gamePhase: 'idle',
    combatLogs: [],
    cycleLogs: [],
    enemies: [],
    gameOver: false,
    combatVisuals: null,
    showCombatLog: true,
    showCycleLog: true,
  };
}

// Generate chaotic melee positions where paired units are close together
function calcChaosPositions(soldierCount, enemyCount) {
  const totalPairs = Math.min(soldierCount, enemyCount);
  const soldierPositions = [];
  const enemyPositions = [];

  const ZONE_LEFT = COMBAT_CENTER_X - COMBAT_ZONE_HALF;
  const ZONE_RIGHT = COMBAT_CENTER_X + COMBAT_ZONE_HALF;
  const ZONE_WIDTH = ZONE_RIGHT - ZONE_LEFT;

  // Evenly space pair anchors then jitter for chaos
  const pairAnchors = [];
  for (let i = 0; i < totalPairs; i++) {
    const baseX = totalPairs === 1
      ? COMBAT_CENTER_X
      : ZONE_LEFT + (i / (totalPairs - 1)) * ZONE_WIDTH;
    pairAnchors.push(baseX + (Math.random() - 0.5) * 60);
  }
  // Shuffle so the ordering feels random
  pairAnchors.sort(() => Math.random() - 0.5);

  for (let i = 0; i < totalPairs; i++) {
    const px = pairAnchors[i];
    const gap = 30 + Math.random() * 20; // 30-50px between paired units
    const soldierLeft = Math.random() > 0.5;

    soldierPositions.push({
      x: soldierLeft ? px - gap / 2 : px + gap / 2,
      // flipX: face toward the paired enemy
      flipX: !soldierLeft,
    });
    enemyPositions.push({
      x: soldierLeft ? px + gap / 2 : px - gap / 2,
      flipX: soldierLeft,
    });
  }

  // Extra units (ganging up) cluster near existing opponents
  const moreSoldiers = soldierCount > enemyCount;
  const extraCount = Math.abs(soldierCount - enemyCount);

  for (let i = 0; i < extraCount; i++) {
    const targetIdx = i % totalPairs;
    if (moreSoldiers) {
      const near = enemyPositions[targetIdx];
      const offset = -(40 + Math.random() * 20);
      soldierPositions.push({ x: near.x + offset, flipX: offset > 0 });
    } else {
      const near = soldierPositions[targetIdx];
      const offset = 40 + Math.random() * 20;
      enemyPositions.push({ x: near.x + offset, flipX: offset < 0 });
    }
  }

  return { soldierPositions, enemyPositions };
}

// Starting march positions — soldiers from village, enemies from far right
function calcMarchStartPositions(soldierCount, enemyCount) {
  const soldierPositions = [];
  const enemyPositions = [];

  for (let i = 0; i < soldierCount; i++) {
    soldierPositions.push({ x: 100 + (i * 60) % 600 });
  }

  for (let i = 0; i < enemyCount; i++) {
    enemyPositions.push({ x: 1500 + i * 30 });
  }

  return { soldierPositions, enemyPositions };
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [currentMenu, setCurrentMenu] = useState([]);
  const combatTimerRef = useRef(null);
  const combatStartedRef = useRef(false);

  const {
    resources, soldiers, barracks, cycle,
    gamePhase, combatLogs, cycleLogs, enemies, gameOver,
    combatVisuals, showCombatLog, showCycleLog,
  } = state;

  // Build barracks
  const handleBuildBarracks = useCallback(() => {
    setState(prev => {
      if (prev.barracks.built || prev.resources.buildingMaterials < BARRACKS_BUILD_COST) return prev;
      return {
        ...prev,
        barracks: { ...prev.barracks, built: true },
        resources: spendResources(prev.resources, { buildingMaterials: BARRACKS_BUILD_COST }),
        cycleLogs: [...prev.cycleLogs, 'Barracks built!'],
      };
    });
  }, []);

  const handleSetDesiredOutput = useCallback((val) => {
    setState(prev => ({ ...prev, barracks: { ...prev.barracks, desiredOutput: val } }));
  }, []);

  const handleSetMaxCap = useCallback((val) => {
    setState(prev => ({ ...prev, barracks: { ...prev.barracks, maxArmyCap: val } }));
  }, []);

  // ==== VISUAL COMBAT SYSTEM ====

  const finalizeCombat = useCallback((remainingSoldiers, remainingEnemies, retreatedSoldiers, originalEnemies, logs) => {
    const finalLogs = [...logs];
    const breakthrough = remainingEnemies.length;

    if (remainingEnemies.length === 0) {
      finalLogs.push({ type: 'outcome', result: 'victory' });
    } else if (remainingSoldiers.length === 0) {
      finalLogs.push({ type: 'outcome', result: 'defeat' });
    }

    const enemiesGone = originalEnemies.length - remainingEnemies.length;
    const goldGain = enemiesGone * ENEMY_KILL_REWARD.gold;
    const moraleGain = enemiesGone * ENEMY_KILL_REWARD.morale;
    let moraleLoss = 0;

    if (breakthrough > 0) {
      moraleLoss = breakthrough * ENEMY_BREAKTHROUGH_PENALTY.morale;
      finalLogs.push({ type: 'breakthrough', count: breakthrough, moraleLoss });
    }
    if (goldGain > 0 || moraleGain > 0) {
      finalLogs.push({ type: 'loot', gold: goldGain, morale: moraleGain, kills: enemiesGone });
    }

    const allSurvivors = [...remainingSoldiers, ...retreatedSoldiers];

    setState(prev => {
      const newResources = clampMorale({
        ...prev.resources,
        gold: prev.resources.gold + goldGain,
        morale: prev.resources.morale + moraleGain - moraleLoss,
      });
      return {
        ...prev,
        resources: newResources,
        soldiers: allSurvivors,
        enemies: [],
        gamePhase: 'idle',
        combatLogs: finalLogs,
        combatVisuals: null,
        gameOver: newResources.morale <= 0,
      };
    });
    combatStartedRef.current = false;
  }, []);

  const runVisualCombat = useCallback((combatSoldiers, combatEnemies, allLogs, retreatedSoldiers) => {
    let roundNum = 0;

    // Build unit visual states from positions
    function buildUnitStates(solds, enems, anim, positions, transitionDuration) {
      const states = [];
      const { soldierPositions, enemyPositions } = positions;

      solds.forEach((s, i) => {
        const pos = soldierPositions[i] || { x: 800 };
        states.push({
          id: s.id, side: 'soldier', hp: s.hp, maxHp: s.maxHp,
          x: pos.x, anim,
          flipX: pos.flipX,
          transitionDuration: transitionDuration != null ? transitionDuration : 0.3,
        });
      });
      enems.forEach((e, i) => {
        const pos = enemyPositions[i] || { x: 1100 };
        states.push({
          id: e.id, side: 'enemy', hp: e.hp, maxHp: e.maxHp,
          x: pos.x, anim,
          flipX: pos.flipX,
          transitionDuration: transitionDuration != null ? transitionDuration : 0.3,
        });
      });
      return states;
    }

    // Fight → resolve sequence (shared by all rounds)
    function doFight(currentSoldiers, currentEnemies, logs, retSoldiers, chaosPos) {
      // Show attack animations at current chaos positions
      let fightStates = buildUnitStates(currentSoldiers, currentEnemies, 'attack', chaosPos);
      setState(prev => ({
        ...prev,
        combatVisuals: { phase: 'fight', unitStates: fightStates },
      }));

      combatTimerRef.current = setTimeout(() => {
        // Resolve the round
        const result = resolveRound(currentSoldiers, currentEnemies);
        logs = [...logs, ...result.log];

        const newRetSoldiers = [
          ...retSoldiers,
          ...result.soldiers.filter(s => result.retreatedSoldierIds.includes(s.id)),
        ];

        const remainingSoldiers = result.finalSoldiers || result.soldiers.filter(
          s => s.hp > 0 && !result.retreatedSoldierIds.includes(s.id)
        );
        const remainingEnemies = result.finalEnemies || result.enemies.filter(
          e => e.hp > 0 && !result.retreatedEnemyIds.includes(e.id)
        );

        // Show hurt/death at the same chaos positions
        let resolveStates = [];
        result.soldiers.forEach((s, i) => {
          const pos = chaosPos.soldierPositions[i] || { x: 800 };
          let anim = 'idle';
          if (s.hp <= 0) anim = 'death';
          else if (result.retreatedSoldierIds.includes(s.id)) anim = 'walk';
          else if (s.hp < (currentSoldiers.find(cs => cs.id === s.id)?.hp || s.hp)) anim = 'hurt';
          resolveStates.push({
            id: s.id, side: 'soldier', hp: s.hp, maxHp: s.maxHp,
            x: pos.x, anim, flipX: pos.flipX, transitionDuration: 0.3,
          });
        });
        result.enemies.forEach((e, i) => {
          const pos = chaosPos.enemyPositions[i] || { x: 1100 };
          let anim = 'idle';
          if (e.hp <= 0) anim = 'death';
          else if (result.retreatedEnemyIds.includes(e.id)) anim = 'walk';
          else if (e.hp < (currentEnemies.find(ce => ce.id === e.id)?.hp || e.hp)) anim = 'hurt';
          resolveStates.push({
            id: e.id, side: 'enemy', hp: e.hp, maxHp: e.maxHp,
            x: pos.x, anim, flipX: pos.flipX, transitionDuration: 0.3,
          });
        });

        setState(prev => ({
          ...prev,
          combatVisuals: { phase: 'resolve', unitStates: resolveStates },
          combatLogs: logs,
          soldiers: [...remainingSoldiers, ...newRetSoldiers],
          enemies: remainingEnemies,
        }));

        combatTimerRef.current = setTimeout(() => {
          if (remainingSoldiers.length === 0 || remainingEnemies.length === 0) {
            combatTimerRef.current = setTimeout(() => {
              finalizeCombat(remainingSoldiers, remainingEnemies, newRetSoldiers, combatEnemies, logs);
            }, ROUND_PAUSE);
            return;
          }

          // Next round with fresh chaos positions for survivors
          combatTimerRef.current = setTimeout(() => {
            nextRound(remainingSoldiers, remainingEnemies, logs, newRetSoldiers);
          }, ROUND_PAUSE);
        }, DEATH_ANIM_DURATION);

      }, FIGHT_ANIM_DURATION);
    }

    function nextRound(currentSoldiers, currentEnemies, logs, retSoldiers) {
      roundNum++;
      logs = [...logs, { type: 'round', num: roundNum }];

      // Generate chaotic melee positions
      const chaosPos = calcChaosPositions(currentSoldiers.length, currentEnemies.length);

      if (roundNum === 1) {
        // First round: march from start positions to the melee
        const startPositions = calcMarchStartPositions(currentSoldiers.length, currentEnemies.length);

        // Place units at start positions instantly
        let startStates = buildUnitStates(currentSoldiers, currentEnemies, 'walk', startPositions, 0);
        setState(prev => ({
          ...prev,
          combatVisuals: { phase: 'march', unitStates: startStates },
          combatLogs: logs,
        }));

        // After a tick, set destination with long transition so they walk smoothly
        combatTimerRef.current = setTimeout(() => {
          let walkStates = buildUnitStates(
            currentSoldiers, currentEnemies, 'walk', chaosPos, MARCH_DURATION / 1000
          );
          setState(prev => ({
            ...prev,
            combatVisuals: { phase: 'march', unitStates: walkStates },
          }));

          // Wait for march to finish, then fight
          combatTimerRef.current = setTimeout(() => {
            // Brief idle pause before attacking
            let idleStates = buildUnitStates(currentSoldiers, currentEnemies, 'idle', chaosPos);
            setState(prev => ({
              ...prev,
              combatVisuals: { phase: 'fight', unitStates: idleStates },
            }));

            combatTimerRef.current = setTimeout(() => {
              doFight(currentSoldiers, currentEnemies, logs, retSoldiers, chaosPos);
            }, 500);
          }, MARCH_DURATION);
        }, 50);
      } else {
        // Subsequent rounds: already in melee, shuffle into new chaos positions
        let idleStates = buildUnitStates(currentSoldiers, currentEnemies, 'idle', chaosPos, 0.5);
        setState(prev => ({
          ...prev,
          combatVisuals: { phase: 'fight', unitStates: idleStates },
          combatLogs: logs,
        }));

        combatTimerRef.current = setTimeout(() => {
          doFight(currentSoldiers, currentEnemies, logs, retSoldiers, chaosPos);
        }, 600);
      }
    }

    nextRound(combatSoldiers, combatEnemies, allLogs, retreatedSoldiers);
  }, [finalizeCombat]);

  // Advance cycle
  const handleAdvanceCycle = useCallback(() => {
    if (gamePhase !== 'idle') return;

    setState(prev => {
      const newCycle = prev.cycle + 1;
      let newLogs = [`=== CYCLE ${newCycle} ===`];

      const prodResult = productionPhase(prev.resources, prev.soldiers, prev.barracks);
      let res = prodResult.resources;
      let soldierList = prodResult.soldiers;
      newLogs = [...newLogs, ...prodResult.log];

      const upkeepResult = upkeepPhase(res, soldierList);
      res = upkeepResult.resources;
      soldierList = upkeepResult.soldiers;
      newLogs = [...newLogs, ...upkeepResult.log];

      if (res.morale <= 0) {
        return {
          ...prev, cycle: newCycle, resources: res,
          soldiers: soldierList, cycleLogs: newLogs,
          gameOver: true, gamePhase: 'idle',
        };
      }

      const raidEnemies = generateRaid(newCycle);

      if (raidEnemies.length > 0) {
        newLogs = [...newLogs, `RAID! ${raidEnemies.length} enemies approach!`];

        if (soldierList.length === 0) {
          const moralePenalty = raidEnemies.length * ENEMY_BREAKTHROUGH_PENALTY.morale;
          newLogs = [...newLogs, `No soldiers to defend! ${raidEnemies.length} enemies break through! Morale -${moralePenalty}`];
          res = clampMorale({ ...res, morale: res.morale - moralePenalty });
          return {
            ...prev, cycle: newCycle, resources: res,
            soldiers: soldierList, cycleLogs: newLogs,
            enemies: [], gamePhase: 'idle', combatLogs: [],
            gameOver: res.morale <= 0, showCycleLog: true,
          };
        }

        return {
          ...prev, cycle: newCycle, resources: res,
          soldiers: soldierList, cycleLogs: newLogs,
          enemies: raidEnemies, gamePhase: 'combat',
          combatLogs: [{ type: 'raid', count: raidEnemies.length }],
          showCombatLog: true, showCycleLog: true,
        };
      } else {
        newLogs = [...newLogs, 'No raid this cycle. Peace prevails.'];
        return {
          ...prev, cycle: newCycle, resources: res,
          soldiers: soldierList, cycleLogs: newLogs,
          enemies: [], gamePhase: 'idle', combatLogs: [],
          showCycleLog: true,
        };
      }
    });
  }, [gamePhase]);

  // Start visual combat when enemies appear
  useEffect(() => {
    if (gamePhase === 'combat' && enemies.length > 0 && !combatStartedRef.current) {
      combatStartedRef.current = true;
      const combatSoldiers = soldiers.filter(s => s.hp > 0);
      combatTimerRef.current = setTimeout(() => {
        runVisualCombat(combatSoldiers, enemies, combatLogs, []);
      }, 500);
    }
    return () => {
      if (combatTimerRef.current && gamePhase !== 'combat') {
        clearTimeout(combatTimerRef.current);
      }
    };
  }, [gamePhase, enemies, soldiers, combatLogs, runVisualCombat]);

  const handleRestart = useCallback(() => {
    if (combatTimerRef.current) clearTimeout(combatTimerRef.current);
    combatStartedRef.current = false;
    setState(initialState());
    setCurrentMenu([]);
  }, []);

  const showBarracks = currentMenu.length === 2 && currentMenu[0] === 'Buildings' && currentMenu[1] === 'Barracks';

  return (
    <div style={styles.app}>
      <ResourceBar resources={resources} cycle={cycle} />

      <div style={styles.gameArea}>
        <VillageScene
          soldiers={soldiers}
          enemies={enemies}
          barracksBuilt={barracks.built}
          combatActive={gamePhase === 'combat'}
          combatVisuals={combatVisuals}
        />

        {showCycleLog && cycleLogs.length > 0 && (
          <CycleLog
            logs={cycleLogs}
            onClose={() => setState(prev => ({ ...prev, showCycleLog: false }))}
          />
        )}

        {showCombatLog && (gamePhase === 'combat' || combatLogs.length > 0) && (
          <CombatLog
            logs={combatLogs}
            combatActive={gamePhase === 'combat'}
            soldiers={soldiers}
            enemies={enemies}
            onClose={() => setState(prev => ({ ...prev, showCombatLog: false }))}
          />
        )}

        {showBarracks && (
          <div style={styles.menuOverlay}>
            <BarracksMenu
              barracks={barracks}
              soldiers={soldiers}
              resources={resources}
              onBuild={handleBuildBarracks}
              onSetDesiredOutput={handleSetDesiredOutput}
              onSetMaxCap={handleSetMaxCap}
              onClose={() => setCurrentMenu([])}
            />
          </div>
        )}
      </div>

      <BottomNav
        currentMenu={currentMenu}
        onNavigate={setCurrentMenu}
        onAdvanceCycle={handleAdvanceCycle}
        canAdvance={gamePhase === 'idle' && !gameOver}
        gamePhase={gamePhase}
      />

      {gameOver && <GameOver cycle={cycle} onRestart={handleRestart} />}
    </div>
  );
}

const styles = {
  app: {
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    background: '#1a0e00',
    fontFamily: '"Segoe UI", sans-serif',
  },
  gameArea: {
    position: 'relative',
    marginTop: '48px',
    height: 'calc(100dvh - 100px)',
    overflow: 'hidden',
  },
  menuOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 60,
  },
};

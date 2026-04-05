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
const SOLDIER_SPACING = 50;
const ENEMY_SPACING = 50;
const COMBAT_GAP = 80; // gap between front lines

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

// Calculate combat positions for units
function calcCombatPositions(soldierCount, enemyCount) {
  const soldierPositions = [];
  const enemyPositions = [];

  // Soldiers on the left, enemies on the right
  const frontLineX = COMBAT_CENTER_X - COMBAT_GAP / 2;
  const enemyFrontX = COMBAT_CENTER_X + COMBAT_GAP / 2;

  for (let i = 0; i < soldierCount; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    soldierPositions.push({
      x: frontLineX - row * SOLDIER_SPACING - 30,
      y: col * 20 - 20,
    });
  }

  for (let i = 0; i < enemyCount; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    enemyPositions.push({
      x: enemyFrontX + row * ENEMY_SPACING + 30,
      y: col * 20 - 20,
    });
  }

  return { soldierPositions, enemyPositions };
}

// Starting march positions (soldiers from left, enemies from right edge)
function calcMarchStartPositions(soldierCount, enemyCount) {
  const soldierPositions = [];
  const enemyPositions = [];

  for (let i = 0; i < soldierCount; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    soldierPositions.push({
      x: 600 - row * SOLDIER_SPACING,
      y: col * 20 - 20,
    });
  }

  for (let i = 0; i < enemyCount; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    enemyPositions.push({
      x: 1300 + row * ENEMY_SPACING,
      y: col * 20 - 20,
    });
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
      finalLogs.push('=== VICTORY! All enemies defeated or routed! ===');
    } else if (remainingSoldiers.length === 0) {
      finalLogs.push('=== DEFEAT! Your soldiers have fallen or retreated! ===');
    }

    const enemiesGone = originalEnemies.length - remainingEnemies.length;
    const goldGain = enemiesGone * ENEMY_KILL_REWARD.gold;
    const moraleGain = enemiesGone * ENEMY_KILL_REWARD.morale;
    let moraleLoss = 0;

    if (breakthrough > 0) {
      moraleLoss = breakthrough * ENEMY_BREAKTHROUGH_PENALTY.morale;
      finalLogs.push(`${breakthrough} enemies broke through! Morale -${moraleLoss}`);
    }
    if (goldGain > 0) {
      finalLogs.push(`Loot: +${goldGain} gold, +${moraleGain} morale from ${enemiesGone} enemies.`);
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

    // Build initial unit visual states
    function buildUnitStates(solds, enems, anim, positions) {
      const states = [];
      const { soldierPositions, enemyPositions } = positions;

      solds.forEach((s, i) => {
        states.push({
          id: s.id, side: 'soldier', hp: s.hp, maxHp: s.maxHp,
          x: soldierPositions[i]?.x || 800, anim,
        });
      });
      enems.forEach((e, i) => {
        states.push({
          id: e.id, side: 'enemy', hp: e.hp, maxHp: e.maxHp,
          x: enemyPositions[i]?.x || 1100, anim,
        });
      });
      return states;
    }

    function nextRound(currentSoldiers, currentEnemies, logs, retSoldiers) {
      roundNum++;
      logs = [...logs, `--- ROUND ${roundNum} ---`];

      // Phase 1: March to combat positions
      const startPositions = calcMarchStartPositions(currentSoldiers.length, currentEnemies.length);
      const combatPositions = calcCombatPositions(currentSoldiers.length, currentEnemies.length);

      // Show marching
      let marchStates = buildUnitStates(currentSoldiers, currentEnemies, 'walk', startPositions);
      setState(prev => ({
        ...prev,
        combatVisuals: { phase: 'march', unitStates: marchStates },
        combatLogs: logs,
      }));

      combatTimerRef.current = setTimeout(() => {
        // Arrive at combat positions
        let arrivedStates = buildUnitStates(currentSoldiers, currentEnemies, 'idle', combatPositions);
        setState(prev => ({
          ...prev,
          combatVisuals: { phase: 'fight', unitStates: arrivedStates },
        }));

        combatTimerRef.current = setTimeout(() => {
          // Phase 2: Fight! Show attack animations
          let fightStates = buildUnitStates(currentSoldiers, currentEnemies, 'attack', combatPositions);
          setState(prev => ({
            ...prev,
            combatVisuals: { phase: 'fight', unitStates: fightStates },
          }));

          combatTimerRef.current = setTimeout(() => {
            // Phase 3: Resolve the round logic
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

            // Show hurt/death animations based on results
            const resolvePositions = calcCombatPositions(
              result.soldiers.length, result.enemies.length
            );
            let resolveStates = [];

            result.soldiers.forEach((s, i) => {
              let anim = 'idle';
              if (s.hp <= 0) anim = 'death';
              else if (result.retreatedSoldierIds.includes(s.id)) anim = 'walk';
              else if (s.hp < (currentSoldiers.find(cs => cs.id === s.id)?.hp || s.hp)) anim = 'hurt';
              resolveStates.push({
                id: s.id, side: 'soldier', hp: s.hp, maxHp: s.maxHp,
                x: resolvePositions.soldierPositions[i]?.x || 800, anim,
              });
            });

            result.enemies.forEach((e, i) => {
              let anim = 'idle';
              if (e.hp <= 0) anim = 'death';
              else if (result.retreatedEnemyIds.includes(e.id)) anim = 'walk';
              else if (e.hp < (currentEnemies.find(ce => ce.id === e.id)?.hp || e.hp)) anim = 'hurt';
              resolveStates.push({
                id: e.id, side: 'enemy', hp: e.hp, maxHp: e.maxHp,
                x: resolvePositions.enemyPositions[i]?.x || 1100, anim,
              });
            });

            setState(prev => ({
              ...prev,
              combatVisuals: { phase: 'resolve', unitStates: resolveStates },
              combatLogs: logs,
              soldiers: [...remainingSoldiers, ...newRetSoldiers],
              enemies: remainingEnemies,
            }));

            // Wait for hurt/death anims to play
            combatTimerRef.current = setTimeout(() => {
              // Check if combat is over
              if (remainingSoldiers.length === 0 || remainingEnemies.length === 0) {
                combatTimerRef.current = setTimeout(() => {
                  finalizeCombat(remainingSoldiers, remainingEnemies, newRetSoldiers, combatEnemies, logs);
                }, ROUND_PAUSE);
                return;
              }

              // Pause then next round
              combatTimerRef.current = setTimeout(() => {
                nextRound(remainingSoldiers, remainingEnemies, logs, newRetSoldiers);
              }, ROUND_PAUSE);
            }, DEATH_ANIM_DURATION);

          }, FIGHT_ANIM_DURATION);
        }, 500); // brief pause at combat positions before attacking

      }, MARCH_DURATION);
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
          combatLogs: [`RAID: ${raidEnemies.length} enemies attack!`],
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
    height: '100vh',
    overflow: 'hidden',
    background: '#1a0e00',
    fontFamily: '"Segoe UI", sans-serif',
  },
  gameArea: {
    position: 'relative',
    marginTop: '48px',
    height: 'calc(100vh - 48px)',
    paddingBottom: '52px',
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

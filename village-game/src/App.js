import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import ResourceBar from './components/ResourceBar';
import BottomNav from './components/BottomNav';
import BarracksMenu from './components/BarracksMenu';
import VillageScene from './components/VillageScene';
import CombatLog from './components/CombatLog';
import CycleLog from './components/CycleLog';
import GameOver from './components/GameOver';
import { STARTING_RESOURCES, BARRACKS_BUILD_COST, ENEMY_KILL_REWARD, ENEMY_BREAKTHROUGH_PENALTY, COMBAT_ROUND_DELAY_MS } from './game/constants';
import { spendResources, clampMorale } from './game/resources';
import { productionPhase, upkeepPhase } from './game/cycle';
import { resolveRound, generateRaid } from './game/combat';

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
    gamePhase: 'idle', // idle | processing | combat
    combatLogs: [],
    cycleLogs: [],
    enemies: [],
    gameOver: false,
  };
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [currentMenu, setCurrentMenu] = useState([]);
  const combatTimerRef = useRef(null);
  const combatStartedRef = useRef(false);

  const {
    resources, soldiers, barracks, cycle,
    gamePhase, combatLogs, cycleLogs, enemies, gameOver,
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
    setState(prev => ({
      ...prev,
      barracks: { ...prev.barracks, desiredOutput: val },
    }));
  }, []);

  const handleSetMaxCap = useCallback((val) => {
    setState(prev => ({
      ...prev,
      barracks: { ...prev.barracks, maxArmyCap: val },
    }));
  }, []);

  // Finalize combat results
  const finalizeCombat = useCallback((remainingSoldiers, remainingEnemies, retreatedSoldiers, originalEnemies, logs) => {
    const finalLogs = [...logs];

    // Enemies that broke through = enemies remaining when all soldiers gone/retreated
    const breakthrough = remainingEnemies.length;

    if (remainingEnemies.length === 0) {
      finalLogs.push('=== VICTORY! All enemies defeated or routed! ===');
    } else if (remainingSoldiers.length === 0) {
      finalLogs.push('=== DEFEAT! Your soldiers have fallen or retreated! ===');
    }

    // +1 gold/morale per enemy no longer remaining (killed or retreated off map)
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

    // Merge surviving + retreated soldiers
    const allSurvivors = [...remainingSoldiers, ...retreatedSoldiers];

    setState(prev => {
      const newResources = clampMorale({
        ...prev.resources,
        gold: prev.resources.gold + goldGain,
        morale: prev.resources.morale + moraleGain - moraleLoss,
      });

      const isGameOver = newResources.morale <= 0;

      return {
        ...prev,
        resources: newResources,
        soldiers: allSurvivors,
        enemies: [],
        gamePhase: 'idle',
        combatLogs: finalLogs,
        gameOver: isGameOver,
      };
    });

    combatStartedRef.current = false;
  }, []);

  // Run combat round by round with delays
  const runCombat = useCallback((combatSoldiers, combatEnemies, allLogs, retreatedSoldiers) => {
    let roundNum = 0;

    function nextRound(currentSoldiers, currentEnemies, logs, retSoldiers) {
      roundNum++;
      logs = [...logs, `--- ROUND ${roundNum} ---`];

      const result = resolveRound(currentSoldiers, currentEnemies);

      logs = [...logs, ...result.log];

      // Track retreated soldiers (they return to village with their HP)
      const newRetSoldiers = [
        ...retSoldiers,
        ...result.soldiers.filter(s => result.retreatedSoldierIds.includes(s.id)),
      ];

      // Get remaining fighters
      const remainingSoldiers = result.finalSoldiers || result.soldiers.filter(
        s => s.hp > 0 && !result.retreatedSoldierIds.includes(s.id)
      );
      const remainingEnemies = result.finalEnemies || result.enemies.filter(
        e => e.hp > 0 && !result.retreatedEnemyIds.includes(e.id)
      );

      // Update display
      setState(prev => ({
        ...prev,
        combatLogs: logs,
        soldiers: [...remainingSoldiers, ...newRetSoldiers],
        enemies: remainingEnemies,
      }));

      // Check if combat is over
      if (remainingSoldiers.length === 0 || remainingEnemies.length === 0) {
        combatTimerRef.current = setTimeout(() => {
          finalizeCombat(remainingSoldiers, remainingEnemies, newRetSoldiers, combatEnemies, logs);
        }, COMBAT_ROUND_DELAY_MS);
        return;
      }

      // Schedule next round
      combatTimerRef.current = setTimeout(() => {
        nextRound(remainingSoldiers, remainingEnemies, logs, newRetSoldiers);
      }, COMBAT_ROUND_DELAY_MS);
    }

    nextRound(combatSoldiers, combatEnemies, allLogs, retreatedSoldiers);
  }, [finalizeCombat]);

  // Advance cycle
  const handleAdvanceCycle = useCallback(() => {
    if (gamePhase !== 'idle') return;

    setState(prev => {
      const newCycle = prev.cycle + 1;
      let newLogs = [`=== CYCLE ${newCycle} ===`];

      // 1. Production phase
      const prodResult = productionPhase(prev.resources, prev.soldiers, prev.barracks);
      let res = prodResult.resources;
      let soldierList = prodResult.soldiers;
      newLogs = [...newLogs, ...prodResult.log];

      // 2. Upkeep phase
      const upkeepResult = upkeepPhase(res, soldierList);
      res = upkeepResult.resources;
      soldierList = upkeepResult.soldiers;
      newLogs = [...newLogs, ...upkeepResult.log];

      // Check morale after upkeep
      if (res.morale <= 0) {
        return {
          ...prev,
          cycle: newCycle,
          resources: res,
          soldiers: soldierList,
          cycleLogs: newLogs,
          gameOver: true,
          gamePhase: 'idle',
        };
      }

      // 3. Crisis phase - generate raid
      const raidEnemies = generateRaid(newCycle);

      if (raidEnemies.length > 0) {
        newLogs = [...newLogs, `RAID! ${raidEnemies.length} enemies approach!`];

        if (soldierList.length === 0) {
          const moralePenalty = raidEnemies.length * ENEMY_BREAKTHROUGH_PENALTY.morale;
          newLogs = [...newLogs, `No soldiers to defend! ${raidEnemies.length} enemies break through! Morale -${moralePenalty}`];
          res = clampMorale({ ...res, morale: res.morale - moralePenalty });

          return {
            ...prev,
            cycle: newCycle,
            resources: res,
            soldiers: soldierList,
            cycleLogs: newLogs,
            enemies: [],
            gamePhase: 'idle',
            combatLogs: [],
            gameOver: res.morale <= 0,
          };
        }

        return {
          ...prev,
          cycle: newCycle,
          resources: res,
          soldiers: soldierList,
          cycleLogs: newLogs,
          enemies: raidEnemies,
          gamePhase: 'combat',
          combatLogs: [`RAID: ${raidEnemies.length} enemies attack!`],
        };
      } else {
        newLogs = [...newLogs, 'No raid this cycle. Peace prevails.'];
        return {
          ...prev,
          cycle: newCycle,
          resources: res,
          soldiers: soldierList,
          cycleLogs: newLogs,
          enemies: [],
          gamePhase: 'idle',
          combatLogs: [],
        };
      }
    });
  }, [gamePhase]);

  // Start combat when enemies appear
  useEffect(() => {
    if (gamePhase === 'combat' && enemies.length > 0 && !combatStartedRef.current) {
      combatStartedRef.current = true;
      const combatSoldiers = soldiers.filter(s => s.hp > 0);
      combatTimerRef.current = setTimeout(() => {
        runCombat(combatSoldiers, enemies, combatLogs, []);
      }, COMBAT_ROUND_DELAY_MS);
    }
    return () => {
      if (combatTimerRef.current && gamePhase !== 'combat') {
        clearTimeout(combatTimerRef.current);
      }
    };
  }, [gamePhase, enemies, soldiers, combatLogs, runCombat]);

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
        />

        {cycleLogs.length > 0 && (
          <CycleLog logs={cycleLogs} />
        )}

        {(gamePhase === 'combat' || combatLogs.length > 0) && (
          <CombatLog
            logs={combatLogs}
            combatActive={gamePhase === 'combat'}
            soldiers={soldiers}
            enemies={enemies}
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
    marginTop: '50px',
    marginBottom: '56px',
    height: 'calc(100vh - 106px)',
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

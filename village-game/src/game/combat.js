import { RETREAT_HP_THRESHOLD } from './constants';

// Roll a d6
function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

// Roll multiple d6 and sum
function rollMultipleD6(count) {
  let total = 0;
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const r = rollD6();
    rolls.push(r);
    total += r;
  }
  return { total, rolls };
}

/**
 * Resolve one round of combat.
 * Returns { soldiers, enemies, retreatedSoldiers, retreatedEnemies, log, roundOver }
 */
export function resolveRound(soldiers, enemies) {
  const log = [];
  const updatedSoldiers = soldiers.map(s => ({ ...s }));
  const updatedEnemies = enemies.map(e => ({ ...e }));
  const retreatedSoldierIds = [];
  const retreatedEnemyIds = [];

  const aliveSoldiers = updatedSoldiers.filter(s => s.hp > 0);
  const aliveEnemies = updatedEnemies.filter(e => e.hp > 0);

  if (aliveSoldiers.length === 0 || aliveEnemies.length === 0) {
    return { soldiers: updatedSoldiers, enemies: updatedEnemies, retreatedSoldierIds, retreatedEnemyIds, log, roundOver: true };
  }

  // Create pairings - extras gang up
  const pairings = createPairings(aliveSoldiers, aliveEnemies);

  for (const pairing of pairings) {
    const { attackers, defenders, attackerSide } = pairing;

    // Roll dice (reroll ties)
    let attackerResult, defenderResult;
    let ties = 0;
    let resolved = false;

    while (!resolved) {
      attackerResult = rollMultipleD6(attackers.length);
      defenderResult = rollMultipleD6(defenders.length);

      if (attackerResult.total !== defenderResult.total) {
        resolved = true;
      } else {
        ties++;
      }
    }

    const attackerWins = attackerResult.total > defenderResult.total;

    // Determine which side is soldiers vs enemies
    const soldierUnits = attackerSide === 'soldiers' ? attackers : defenders;
    const enemyUnits = attackerSide === 'soldiers' ? defenders : attackers;
    const soldierRoll = attackerSide === 'soldiers' ? attackerResult.total : defenderResult.total;
    const enemyRoll = attackerSide === 'soldiers' ? defenderResult.total : attackerResult.total;
    const soldiersWin = (attackerSide === 'soldiers') === attackerWins;

    // Apply damage
    const hits = [];
    if (soldiersWin) {
      for (const e of enemyUnits) {
        e.hp -= 1;
        hits.push({ side: 'enemy', id: e.id, hp: e.hp, maxHp: e.maxHp });
      }
    } else {
      for (const s of soldierUnits) {
        s.hp -= 1;
        hits.push({ side: 'soldier', id: s.id, hp: s.hp, maxHp: s.maxHp });
      }
    }

    log.push({
      type: 'duel',
      soldiers: soldierUnits.map(s => s.id),
      enemies: enemyUnits.map(e => e.id),
      soldierRoll,
      enemyRoll,
      soldiersWin,
      ties,
      hits,
    });
  }

  // Check for dead units
  const deadSoldiers = updatedSoldiers.filter(s => s.hp <= 0);
  const deadEnemies = updatedEnemies.filter(e => e.hp <= 0);

  for (const ds of deadSoldiers) {
    log.push({ type: 'death', side: 'soldier', id: ds.id });
  }
  for (const de of deadEnemies) {
    log.push({ type: 'death', side: 'enemy', id: de.id });
  }

  // Filter to alive for retreat check
  const remainingSoldiers = updatedSoldiers.filter(s => s.hp > 0);
  const remainingEnemies = updatedEnemies.filter(e => e.hp > 0);

  const soldierCount = remainingSoldiers.length;
  const enemyCount = remainingEnemies.length;

  for (const s of remainingSoldiers) {
    if (s.hp <= RETREAT_HP_THRESHOLD && !(soldierCount >= enemyCount * 2)) {
      retreatedSoldierIds.push(s.id);
      log.push({ type: 'retreat', side: 'soldier', id: s.id, hp: s.hp });
    }
  }

  for (const e of remainingEnemies) {
    if (e.hp <= RETREAT_HP_THRESHOLD && !(enemyCount >= soldierCount * 2)) {
      retreatedEnemyIds.push(e.id);
      log.push({ type: 'retreat', side: 'enemy', id: e.id, hp: e.hp });
    }
  }

  // Filter out retreated
  const finalSoldiers = updatedSoldiers.filter(
    s => s.hp > 0 && !retreatedSoldierIds.includes(s.id)
  );
  const finalEnemies = updatedEnemies.filter(
    e => e.hp > 0 && !retreatedEnemyIds.includes(e.id)
  );

  const roundOver = finalSoldiers.length === 0 || finalEnemies.length === 0;

  return {
    soldiers: updatedSoldiers,
    enemies: updatedEnemies,
    retreatedSoldierIds,
    retreatedEnemyIds,
    log,
    roundOver,
    finalSoldiers,
    finalEnemies,
  };
}

function createPairings(soldiers, enemies) {
  const pairings = [];
  const larger = soldiers.length >= enemies.length ? 'soldiers' : 'enemies';

  if (larger === 'soldiers') {
    // Each enemy gets paired, extras soldiers gang up
    const basePerEnemy = Math.floor(soldiers.length / enemies.length);
    let extras = soldiers.length % enemies.length;
    let soldierIdx = 0;

    for (let i = 0; i < enemies.length; i++) {
      const count = basePerEnemy + (extras > 0 ? 1 : 0);
      if (extras > 0) extras--;
      const attackers = soldiers.slice(soldierIdx, soldierIdx + count);
      soldierIdx += count;
      pairings.push({ attackers, defenders: [enemies[i]], attackerSide: 'soldiers' });
    }
  } else {
    // Each soldier gets paired, extra enemies gang up
    const basePerSoldier = Math.floor(enemies.length / soldiers.length);
    let extras = enemies.length % soldiers.length;
    let enemyIdx = 0;

    for (let i = 0; i < soldiers.length; i++) {
      const count = basePerSoldier + (extras > 0 ? 1 : 0);
      if (extras > 0) extras--;
      const attackers = enemies.slice(enemyIdx, enemyIdx + count);
      enemyIdx += count;
      pairings.push({ attackers, defenders: [soldiers[i]], attackerSide: 'enemies' });
    }
  }

  return pairings;
}

/**
 * Get max enemies for a given cycle
 */
export function getMaxEnemies(cycle) {
  if (cycle <= 3) return 0;
  if (cycle === 4) return 3;
  if (cycle === 5) return 6;
  // 6+: base 9, +3 per cycle after 6, capped at 30
  const max = 9 + (cycle - 6) * 3;
  return Math.min(max, 30);
}

/**
 * Generate raid enemies for a cycle
 */
export function generateRaid(cycle) {
  const maxEnemies = getMaxEnemies(cycle);
  if (maxEnemies === 0) return [];

  const count = Math.floor(Math.random() * maxEnemies) + 1;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    hp: 4,
    maxHp: 4,
  }));
}

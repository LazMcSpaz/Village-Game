import { SOLDIER_PRODUCTION_COST, SOLDIER_UPKEEP_COST, SOLDIER_HP } from './constants';
import { canAfford, spendResources, clampMorale } from './resources';

/**
 * Production phase: produce soldiers from barracks
 */
export function productionPhase(resources, soldiers, barracks) {
  if (!barracks.built) return { resources, soldiers, log: ['No barracks built — skipping production.'] };

  const log = [];
  let res = { ...resources };
  const newSoldiers = [...soldiers];
  const currentCount = newSoldiers.length;
  const canProduce = Math.min(
    barracks.desiredOutput,
    barracks.maxArmyCap - currentCount,
    5 // hard max per cycle
  );

  let produced = 0;
  for (let i = 0; i < Math.max(0, canProduce); i++) {
    if (canAfford(res, SOLDIER_PRODUCTION_COST)) {
      res = spendResources(res, SOLDIER_PRODUCTION_COST);
      const id = (soldiers.length > 0 ? Math.max(...soldiers.map(s => s.id)) : 0) + produced + 1;
      newSoldiers.push({ id, hp: SOLDIER_HP, maxHp: SOLDIER_HP });
      produced++;
    } else {
      break;
    }
  }

  if (produced > 0) {
    log.push(`Barracks produced ${produced} soldier${produced > 1 ? 's' : ''}.`);
  } else {
    log.push('No soldiers produced this cycle.');
  }

  return { resources: res, soldiers: newSoldiers, log };
}

/**
 * Upkeep phase: existing soldiers consume resources
 */
export function upkeepPhase(resources, soldiers) {
  const log = [];
  let res = { ...resources };
  let currentSoldiers = [...soldiers];

  const totalUpkeep = {
    gold: currentSoldiers.length * SOLDIER_UPKEEP_COST.gold,
    food: currentSoldiers.length * SOLDIER_UPKEEP_COST.food,
  };

  log.push(`Upkeep required: ${totalUpkeep.gold} gold, ${totalUpkeep.food} food for ${currentSoldiers.length} soldiers.`);

  // Kill soldiers until upkeep is affordable
  let soldiersLost = 0;
  while (currentSoldiers.length > 0 && !canAfford(res, {
    gold: currentSoldiers.length * SOLDIER_UPKEEP_COST.gold,
    food: currentSoldiers.length * SOLDIER_UPKEEP_COST.food,
  })) {
    currentSoldiers.pop(); // remove last soldier
    soldiersLost++;
    res.morale -= 1;
  }

  if (soldiersLost > 0) {
    log.push(`${soldiersLost} soldier${soldiersLost > 1 ? 's' : ''} died from lack of resources. Morale -${soldiersLost}.`);
  }

  // Pay upkeep for remaining
  if (currentSoldiers.length > 0) {
    const actualUpkeep = {
      gold: currentSoldiers.length * SOLDIER_UPKEEP_COST.gold,
      food: currentSoldiers.length * SOLDIER_UPKEEP_COST.food,
    };
    res = spendResources(res, actualUpkeep);
    log.push(`Paid upkeep: ${actualUpkeep.gold} gold, ${actualUpkeep.food} food.`);
  }

  res = clampMorale(res);
  return { resources: res, soldiers: currentSoldiers, log };
}

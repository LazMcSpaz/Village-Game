// Starting resources
export const STARTING_RESOURCES = {
  gold: 100,
  food: 100,
  buildingMaterials: 100,
  morale: 50,
};

// Barracks
export const BARRACKS_BUILD_COST = 10; // building materials
export const MAX_PRODUCTION_PER_CYCLE = 5;
export const MAX_ARMY_CAP = 20;
export const SOLDIER_PRODUCTION_COST = { gold: 1, food: 1 };
export const SOLDIER_UPKEEP_COST = { gold: 1, food: 1 };
export const SOLDIER_HP = 4;
export const ENEMY_HP = 4;

// Raid scaling
export const RAID_SCHEDULE = [
  { minCycle: 1, maxCycle: 3, maxEnemies: 0 },
  { minCycle: 4, maxCycle: 4, maxEnemies: 3 },
  { minCycle: 5, maxCycle: 5, maxEnemies: 6 },
  // 6+ is computed dynamically
];
export const RAID_BASE_AT_6 = 9; // 6 + 3
export const RAID_INCREMENT = 3;
export const RAID_HARD_CAP = 30;

// Combat
export const RETREAT_HP_THRESHOLD = 2;
export const COMBAT_ROUND_DELAY_MS = 2500;

// Rewards
export const ENEMY_KILL_REWARD = { gold: 1, morale: 1 };
export const ENEMY_BREAKTHROUGH_PENALTY = { morale: 5 };

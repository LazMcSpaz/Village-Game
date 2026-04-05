// Resource management utilities

export function canAfford(resources, cost) {
  return Object.entries(cost).every(([key, amount]) => resources[key] >= amount);
}

export function spendResources(resources, cost) {
  const next = { ...resources };
  for (const [key, amount] of Object.entries(cost)) {
    next[key] -= amount;
  }
  return next;
}

export function addResources(resources, gains) {
  const next = { ...resources };
  for (const [key, amount] of Object.entries(gains)) {
    next[key] = (next[key] || 0) + amount;
  }
  return next;
}

export function clampMorale(resources) {
  return { ...resources, morale: Math.max(0, resources.morale) };
}

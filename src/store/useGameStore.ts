import { create } from "zustand";
import type { ResourceType } from "../game/modules/module.types";
import { MODULES } from "../game/modules/moduleDefinitions";
import type { CraftingRecipe } from "../game/modules/data/recipesConfig";
import type { ResearchNode } from "../game/modules/data/researchConfig";

const IDEAL_WAKE_HOUR = 7;
const IDEAL_SLEEP_HOUR = 21;
const FAINT_HOUR = 23;
export const DAYLIGHT_START_HOUR = 7;
export const DAYLIGHT_END_HOUR = 19;
const POWER_BANK_CHARGE_RATE = 25;

const FOOD_FATIGUE_RECOVERY = {
  soup: 5,
  meal: 15,
  good_meal: 25,
} as const;

const FOOD_HEALTH_RECOVERY = {
  soup: 0,
  meal: 0,
  good_meal: 10,
} as const;
const FOOD_PRIORITY = ["good_meal", "meal", "soup"] as const;
const OVERTIME_FATIGUE_PER_HOUR = 10;
const NO_FOOD_HEALTH_LOSS = 10;
export const REPAIR_TIME_SPEED = 15;
// Difficulty tuning: percentages are decimal fractions of a module's max HP.
export const RADIATION_DAY_DECAY_PER_SOL = 0.050;
export const RADIATION_NIGHT_DECAY_PER_SOL = 0.075;
export const RADIATION_WAVE_DAMAGE = 0.075;
export const RADIATION_WAVE_INTERVAL_DAYS = 3;
export const RADIATION_TOWER_DAY_REDUCTION = 0.65;
export const RADIATION_TOWER_NIGHT_REDUCTION = 0.65;
export const RADIATION_TOWER_COVERAGE_RADIUS = 4;

const isNightEssential = (moduleId: string) =>
  moduleId === "habitat" ||
  moduleId === "life_support" ||
  moduleId === "battery";

export const getPowerBankCapacity = (
  placedModules: Array<{ id: string; hp: number }>,
) =>
  placedModules.reduce(
    (capacity, module) =>
      capacity +
      (module.hp > 0 ? (MODULES[module.id]?.powerCapacity ?? 0) : 0),
    0,
  );

export const hasOperationalPower = (
  placedModules: Array<{
    id: string;
    hp: number;
    active: boolean;
    powerSupplyEnabled: boolean;
  }>,
  powerBankCharge: number,
  currentHour: number,
) => {
  let generated = 0;
  let consumed = 0;

  placedModules.forEach((module) => {
    if (module.hp <= 0 || !module.active) return;
    const config = MODULES[module.id];
    if (!config) return;

    if (config.powerDraw > 0) {
      if (
        currentHour >= DAYLIGHT_START_HOUR &&
        currentHour < DAYLIGHT_END_HOUR
      ) {
        generated += config.powerDraw;
      }
    } else {
      consumed += Math.abs(config.powerDraw);
    }
  });

  const canSupplyFromBattery = placedModules.some(
    (module) =>
      module.id === "battery" &&
      module.hp > 0 &&
      module.active &&
      module.powerSupplyEnabled,
  );

  return (
    generated >= consumed ||
    (canSupplyFromBattery && powerBankCharge >= consumed - generated)
  );
};
const STARTING_DISCOVERED_RESOURCES: ResourceType[] = [
  "iron_ore",
  "silicates",
  "water",
  "raw_food",
  "soup",
  "repair_kit",
  "iron_plate",
  "glass_panel",
  "electronics",
];

export interface CraftQueueItem {
  id: string;
  recipe: CraftingRecipe;
  queuedAt: number;
  startedAt: number;
  completesAt: number;
  completed: boolean;
}

export interface ResearchQueueItem {
  id: string;
  node: ResearchNode;
  queuedAt: number;
  startedAt: number;
  completesAt: number;
}

interface RepairJob {
  elapsedMinutes: number;
  startedAt: number | null;
}

const getGameHour = (day: number, hour: number, minute = 0) =>
  day * 24 + hour + minute / 60;

export const getInventoryTotal = (
  inventory: Record<ResourceType, number>,
) => Object.values(inventory).reduce((total, amount) => total + amount, 0);

export const getStorageCapacity = (
  placedModules: Array<{ id: string }>,
) =>
  placedModules.reduce(
    (capacity, module) =>
      capacity + (MODULES[module.id]?.moduleCapacity ?? 0),
    0,
  );

interface GameState {
  // --- STATE VARIABLES ---
  inventory: Record<ResourceType, number>;
  discoveredResourceTypes: ResourceType[];
  placedModules: Array<{
    id: string;
    instanceId: string;
    x: number;
    y: number;
    hp: number;
    active: boolean;
    powerSupplyEnabled: boolean;
  }>;
  astronautHealth: number;
  powerBankCharge: number;
  currentDay: number;
  lastRadiationWaveDay: number;
  currentHour: number;
  currentMinute: number;
  fatigueLevel: number;
  isFainted: boolean;
  nextWakeHour: number;
  overtimeHours: number;
  timerIntervalId: null | ReturnType<typeof setInterval>;
  workshopQueue: CraftQueueItem[];
  kitchenQueue: CraftQueueItem[];
  greenhouseQueue: CraftQueueItem[];
  researchQueue: ResearchQueueItem[];
  researchedNodeIds: string[];
  unlockedModuleIds: string[];

  activeRepairInstanceId: string | null; // Tracks which module is currently being wrenched
  repairJobs: Record<string, RepairJob>;
  startRepair: (instanceId: string) => boolean;
  pauseRepair: (instanceId: string) => void;
  getRepairElapsedMinutes: (instanceId: string) => number;
  startActiveRepairLoop: (instanceId: string) => void;
  stopActiveRepairLoop: () => void;

  // // NEW MECHANICS STATE
  isCommsEstablished: boolean; // Unlocks Sol 15 mission step
  gameLogs: string[]; // Narration strings push here for UI console

  // --- ACTIONS (MUTATORS) ---
  unlockResource: (resource: ResourceType) => void;
  addResource: (resource: ResourceType, amount: number) => void;
  consumeResource: (resource: ResourceType, amount: number) => boolean;
  craftItem: (
    outputItem: ResourceType,
    recipe: Array<{ resource: ResourceType; amount: number }>,
  ) => boolean;
  queueCrafting: (recipe: CraftingRecipe) => boolean;
  cancelCrafting: (queueItemId: string) => boolean;
  processWorkshopQueue: () => void;
  queueKitchenCrafting: (recipe: CraftingRecipe) => boolean;
  cancelKitchenCrafting: (queueItemId: string) => boolean;
  processKitchenQueue: () => void;
  queueGreenhouseCrafting: (recipe: CraftingRecipe) => boolean;
  cancelGreenhouseCrafting: (queueItemId: string) => boolean;
  processGreenhouseQueue: () => void;
  queueResearch: (node: ResearchNode) => boolean;
  cancelResearch: (queueItemId: string) => boolean;
  processResearchQueue: () => void;
  unlockModuleBlueprint: (moduleId: string) => void;
  buildModule: (moduleId: string, gridX: number, gridY: number) => boolean;
  toggleModule: (instanceId: string) => void;
  togglePowerSupply: (instanceId: string) => void;

  // // EXTENDED SYSTEM ACTIONS
  sleepUntilMorning: () => boolean;
  workOvertime: () => boolean;
  repairModule: (instanceId: string) => boolean;
  completeRepair: (instanceId: string) => boolean;
  establishComms: () => boolean;
  advanceHour: (
    hours: number,
    options?: { pauseWorkshop?: boolean },
  ) => void;
  startPassiveTimer: () => void;
  stopPassiveTimer: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 1. Initial State Definitions
  inventory: {
    iron_ore: 15,
    silicates: 15,
    iron_plate: 25,
    glass_panel: 20,
    electronics: 10,
    repair_kit: 2,
    water_filter: 0,
    air_filter: 0,
    water: 10,
    raw_food: 5,
    soup: 1,
    meal: 0,
    good_meal: 0,
  },
  discoveredResourceTypes: STARTING_DISCOVERED_RESOURCES,

  queueGreenhouseCrafting: (recipe) => {
    const { inventory, greenhouseQueue } = get();
    const hasMaterials = recipe.cost.every(
      (req) => (inventory[req.resource] || 0) >= req.amount,
    );
    if (!hasMaterials) return false;

    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );
    const lastItem = [...greenhouseQueue]
      .reverse()
      .find((queued) => !queued.completed);
    const startsAt = lastItem ? lastItem.completesAt : now;
    const item: CraftQueueItem = {
      id: `greenhouse-${recipe.output}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      recipe,
      queuedAt: now,
      startedAt: startsAt,
      completesAt: startsAt + recipe.craftHours,
      completed: false,
    };

    set((state) => {
      const nextInventory = { ...state.inventory };
      recipe.cost.forEach((req) => {
        nextInventory[req.resource] -= req.amount;
      });
      return {
        inventory: nextInventory,
        greenhouseQueue: [...state.greenhouseQueue, item],
      };
    });
    return true;
  },

  cancelGreenhouseCrafting: (queueItemId) => {
    const item = get().greenhouseQueue.find(
      (queued) => queued.id === queueItemId,
    );
    if (!item) return false;

    set((state) => {
      const cancelledIndex = state.greenhouseQueue.findIndex(
        (queued) => queued.id === queueItemId,
      );
      if (cancelledIndex < 0) return state;

      const nextQueue = state.greenhouseQueue.filter(
        (queued) => queued.id !== queueItemId,
      );
      const now = getGameHour(
        state.currentDay,
        state.currentHour,
        state.currentMinute,
      );
      const activeIndex = state.greenhouseQueue.findIndex(
        (queued) => !queued.completed,
      );
      const shouldStartNextImmediately = cancelledIndex === activeIndex;
      let cursor = shouldStartNextImmediately ? now : null;
      const reflowedQueue = nextQueue.map((queued) => {
        if (queued.completed) return queued;

        const originalIndex = state.greenhouseQueue.findIndex(
          (original) => original.id === queued.id,
        );
        if (!shouldStartNextImmediately && originalIndex < cancelledIndex) {
          cursor = queued.completesAt;
          return queued;
        }

        const startsAt = cursor ?? queued.startedAt;
        const reflowed = {
          ...queued,
          startedAt: startsAt,
          completesAt: startsAt + queued.recipe.craftHours,
        };
        cursor = reflowed.completesAt;
        return reflowed;
      });
      const nextInventory = { ...state.inventory };
      if (!item.completed) {
        item.recipe.cost.forEach((req) => {
          nextInventory[req.resource] =
            (nextInventory[req.resource] || 0) + req.amount;
        });
      }
      return { inventory: nextInventory, greenhouseQueue: reflowedQueue };
    });
    return true;
  },

  processGreenhouseQueue: () => {
    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );

    set((state) => {
      const completedItems = state.greenhouseQueue.filter(
        (item) => !item.completed && item.completesAt <= now,
      );
      if (completedItems.length === 0) return state;

      const completedIds = new Set(completedItems.map((item) => item.id));
      const nextInventory = { ...state.inventory };
      const nextLogs = [...state.gameLogs];
      completedItems.forEach((item) => {
        nextInventory[item.recipe.output] =
          (nextInventory[item.recipe.output] || 0) +
          (item.recipe.outputAmount ?? 1);
        nextLogs.push(
          `🌱 GREENHOUSE COMPLETE: ${item.recipe.name} added to inventory.`,
        );
      });

      return {
        inventory: nextInventory,
        discoveredResourceTypes: completedItems.reduce(
          (resources, item) =>
            resources.includes(item.recipe.output)
              ? resources
              : [...resources, item.recipe.output],
          state.discoveredResourceTypes,
        ),
        gameLogs: nextLogs,
        greenhouseQueue: state.greenhouseQueue.map((item) =>
          completedIds.has(item.id) ? { ...item, completed: true } : item,
        ),
      };
    });
  },
  unlockedModuleIds: [
    "habitat",
    "greenhouse",
    "water",
    "drill",
    "workshop",
    "solar",
    "battery",
  ],
  placedModules: [],
  astronautHealth: 100,
  powerBankCharge: 0,
  currentDay: 1,
  lastRadiationWaveDay: 1,
  currentHour: 7, // The ideal work day starts at 07:00
  currentMinute: 0,
  isFainted: false,
  nextWakeHour: IDEAL_WAKE_HOUR,
  overtimeHours: 0,

  timerIntervalId: null,
  workshopQueue: [],
  kitchenQueue: [],
  greenhouseQueue: [],
  researchQueue: [],
  researchedNodeIds: [],
  activeRepairInstanceId: null,
  repairJobs: {},

  // // NEW MECHANICS STATE
  fatigueLevel: 0,
  isCommsEstablished: false,
  gameLogs: [
    "Sol 01: System online. Establish base foundations before environmental anomalies manifest.",
  ],

  unlockModuleBlueprint: (moduleId: string) =>
    set((state: any) => {
      if (state.unlockedModuleIds.includes(moduleId)) return {};

      return {
        unlockedModuleIds: [...state.unlockedModuleIds, moduleId],
        gameLogs: [
          ...state.gameLogs,
          `🔬 RESEARCH SUCCESS: New blueprint pattern unlocked: Unlocked structural authorization for ${moduleId.replace("_", " ")}.`,
        ],
      };
    }),

  unlockResource: (resource) =>
    set((state) =>
      state.discoveredResourceTypes.includes(resource)
        ? state
        : {
            discoveredResourceTypes: [
              ...state.discoveredResourceTypes,
              resource,
            ],
          },
    ),

  queueResearch: (node) => {
    const { researchQueue, inventory, researchedNodeIds } = get();
    if (
      researchQueue.length >= 2 ||
      researchedNodeIds.includes(node.id) ||
      researchQueue.some((item) => item.node.id === node.id) ||
      (node.requires ?? []).some(
        (requiredId) => !researchedNodeIds.includes(requiredId),
      ) ||
      inventory.silicates < node.silicateCost
    ) {
      return false;
    }

    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );
    const lastItem = researchQueue[researchQueue.length - 1];
    const startsAt = lastItem ? lastItem.completesAt : now;
    const item: ResearchQueueItem = {
      id: `research-${node.id}-${Date.now()}`,
      node,
      queuedAt: now,
      startedAt: startsAt,
      completesAt: startsAt + node.researchHours,
    };

    set((state) => ({
      inventory: {
          ...state.inventory,
          silicates: state.inventory.silicates - node.silicateCost,
      },
      researchQueue: [...state.researchQueue, item],
    }));
    return true;
  },

  cancelResearch: (queueItemId) => {
    const item = get().researchQueue.find((queued) => queued.id === queueItemId);
    if (!item) return false;

    set((state) => {
      const index = state.researchQueue.findIndex(
          (queued) => queued.id === queueItemId,
      );
      const nextQueue = state.researchQueue.filter(
          (queued) => queued.id !== queueItemId,
      );
      const now = getGameHour(
          state.currentDay,
          state.currentHour,
          state.currentMinute,
      );
      let cursor = index === 0 ? now : null;
      const reflowedQueue = nextQueue.map((queued, queueIndex) => {
          if (queueIndex < index && index !== 0) return queued;
          const startedAt = cursor ?? queued.startedAt;
          const reflowed = {
            ...queued,
            startedAt,
            completesAt: startedAt + queued.node.researchHours,
          };
          cursor = reflowed.completesAt;
          return reflowed;
      });

      return {
          inventory: {
            ...state.inventory,
            silicates: state.inventory.silicates + item.node.silicateCost,
          },
          researchQueue: reflowedQueue,
      };
    });
    return true;
  },

  processResearchQueue: () => {
    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );
    set((state) => {
      const completed = state.researchQueue.find(
          (item) => item.completesAt <= now,
      );
      if (!completed) return state;

      const nextDiscovered = completed.node.unlocks?.resource
          ? state.discoveredResourceTypes.includes(completed.node.unlocks.resource)
            ? state.discoveredResourceTypes
            : [
                ...state.discoveredResourceTypes,
                completed.node.unlocks.resource,
              ]
          : state.discoveredResourceTypes;
      const nextModules = completed.node.unlocks?.moduleId
          ? state.unlockedModuleIds.includes(completed.node.unlocks.moduleId)
            ? state.unlockedModuleIds
            : [...state.unlockedModuleIds, completed.node.unlocks.moduleId]
          : state.unlockedModuleIds;
      return {
          researchQueue: state.researchQueue.filter(
            (item) => item.id !== completed.id,
          ),
          researchedNodeIds: [...state.researchedNodeIds, completed.node.id],
          discoveredResourceTypes: nextDiscovered,
          unlockedModuleIds: nextModules,
          gameLogs: [
            ...state.gameLogs,
            `🔬 RESEARCH COMPLETE: ${completed.node.name} unlocked.`,
          ],
      };
    });
  },

  // 2. Add resources (Called when mining finishes or processing completes)
  addResource: (resource, amount) =>
    set((state) => ({
      inventory: {
        ...state.inventory,
        [resource]: (state.inventory[resource] || 0) + amount,
      },
      discoveredResourceTypes: state.discoveredResourceTypes.includes(resource)
        ? state.discoveredResourceTypes
        : [...state.discoveredResourceTypes, resource],
    })),

  // 3. Consume resources safely (Returns false if player doesn't have enough)
  consumeResource: (resource, amount) => {
    const currentAmount = get().inventory[resource] || 0;
    if (currentAmount < amount) return false;

    set((state) => ({
      inventory: { ...state.inventory, [resource]: currentAmount - amount },
    }));
    return true;
  },

  // 4. Workshop Crafting Loop System
  craftItem: (outputItem, recipe) => {
    const { inventory, consumeResource, addResource } = get();

    // Verification check: Does the player have all materials required?
    const hasMaterials = recipe.every(
      (req) => (inventory[req.resource] || 0) >= req.amount,
    );
    if (!hasMaterials) return false;

    // Deduct raw ingredients
    recipe.forEach((req) => consumeResource(req.resource, req.amount));
    // Provide refined product
    addResource(outputItem, 1);
    return true;
  },

  queueCrafting: (recipe) => {
    const { inventory, workshopQueue } = get();
    const hasMaterials = recipe.cost.every(
      (req) => (inventory[req.resource] || 0) >= req.amount,
    );
    if (!hasMaterials) return false;

    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );
    const lastItem = [...workshopQueue]
      .reverse()
      .find((queued) => !queued.completed);
    const startsAt = lastItem ? lastItem.completesAt : now;
    const item: CraftQueueItem = {
      id: `${recipe.output}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      recipe,
      queuedAt: now,
      startedAt: startsAt,
      completesAt: startsAt + recipe.craftHours,
      completed: false,
    };

    set((state) => {
      const nextInventory = { ...state.inventory };
      recipe.cost.forEach((req) => {
        nextInventory[req.resource] -= req.amount;
      });
      return {
        inventory: nextInventory,
        workshopQueue: [...state.workshopQueue, item],
      };
    });
    return true;
  },

  cancelCrafting: (queueItemId) => {
    const item = get().workshopQueue.find(
      (queued) => queued.id === queueItemId,
    );
    if (!item) return false;

    set((state) => {
      const cancelledIndex = state.workshopQueue.findIndex(
        (queued) => queued.id === queueItemId,
      );
      if (cancelledIndex < 0) return state;

      const nextQueue = state.workshopQueue.filter(
        (queued) => queued.id !== queueItemId,
      );
      const now = getGameHour(
        state.currentDay,
        state.currentHour,
        state.currentMinute,
      );
      const activeIndex = state.workshopQueue.findIndex(
        (queued) => !queued.completed,
      );
      const shouldStartNextImmediately = cancelledIndex === activeIndex;
      let cursor = shouldStartNextImmediately ? now : null;
      const reflowedQueue = nextQueue.map((queued) => {
        if (queued.completed) return queued;

        const originalIndex = state.workshopQueue.findIndex(
          (original) => original.id === queued.id,
        );
        if (!shouldStartNextImmediately && originalIndex < cancelledIndex) {
          cursor = queued.completesAt;
          return queued;
        }

        const startsAt = cursor ?? queued.startedAt;
        const reflowed = {
          ...queued,
          startedAt: startsAt,
          completesAt: startsAt + queued.recipe.craftHours,
        };
        cursor = reflowed.completesAt;
        return reflowed;
      });
      const nextInventory = { ...state.inventory };
      if (!item.completed) {
        item.recipe.cost.forEach((req) => {
          nextInventory[req.resource] =
            (nextInventory[req.resource] || 0) + req.amount;
        });
      }
      return { inventory: nextInventory, workshopQueue: reflowedQueue };
    });
    return true;
  },

  processWorkshopQueue: () => {
    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );

    set((state) => {
      const completedItems = state.workshopQueue.filter(
        (item) => !item.completed && item.completesAt <= now,
      );
      if (completedItems.length === 0) return state;

      const completedIds = new Set(completedItems.map((item) => item.id));
      const nextInventory = { ...state.inventory };
      const nextLogs = [...state.gameLogs];
      completedItems.forEach((item) => {
        nextInventory[item.recipe.output] =
          (nextInventory[item.recipe.output] || 0) +
          (item.recipe.outputAmount ?? 1);
        nextLogs.push(
          `🏭 CRAFT COMPLETE: ${item.recipe.name.replace(/^[^ ]+ /, "")} added to inventory.`,
        );
      });

      return {
        inventory: nextInventory,
        discoveredResourceTypes: completedItems.reduce(
          (resources, item) =>
            resources.includes(item.recipe.output)
              ? resources
              : [...resources, item.recipe.output],
          state.discoveredResourceTypes,
        ),
        gameLogs: nextLogs,
        workshopQueue: state.workshopQueue.map((item) =>
          completedIds.has(item.id) ? { ...item, completed: true } : item,
        ),
      };
    });
  },

  queueKitchenCrafting: (recipe) => {
    const { inventory, kitchenQueue } = get();
    const hasMaterials = recipe.cost.every(
      (req) => (inventory[req.resource] || 0) >= req.amount,
    );
    if (!hasMaterials) return false;

    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );
    const lastItem = [...kitchenQueue]
      .reverse()
      .find((queued) => !queued.completed);
    const startsAt = lastItem ? lastItem.completesAt : now;
    const item: CraftQueueItem = {
      id: `kitchen-${recipe.output}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      recipe,
      queuedAt: now,
      startedAt: startsAt,
      completesAt: startsAt + recipe.craftHours,
      completed: false,
    };

    set((state) => {
      const nextInventory = { ...state.inventory };
      recipe.cost.forEach((req) => {
        nextInventory[req.resource] -= req.amount;
      });
      return {
        inventory: nextInventory,
        kitchenQueue: [...state.kitchenQueue, item],
      };
    });
    return true;
  },

  cancelKitchenCrafting: (queueItemId) => {
    const item = get().kitchenQueue.find(
      (queued) => queued.id === queueItemId,
    );
    if (!item) return false;

    set((state) => {
      const cancelledIndex = state.kitchenQueue.findIndex(
        (queued) => queued.id === queueItemId,
      );
      if (cancelledIndex < 0) return state;

      const nextQueue = state.kitchenQueue.filter(
        (queued) => queued.id !== queueItemId,
      );
      const now = getGameHour(
        state.currentDay,
        state.currentHour,
        state.currentMinute,
      );
      const activeIndex = state.kitchenQueue.findIndex(
        (queued) => !queued.completed,
      );
      const shouldStartNextImmediately = cancelledIndex === activeIndex;
      let cursor = shouldStartNextImmediately ? now : null;
      const reflowedQueue = nextQueue.map((queued) => {
        if (queued.completed) return queued;

        const originalIndex = state.kitchenQueue.findIndex(
          (original) => original.id === queued.id,
        );
        if (!shouldStartNextImmediately && originalIndex < cancelledIndex) {
          cursor = queued.completesAt;
          return queued;
        }

        const startsAt = cursor ?? queued.startedAt;
        const reflowed = {
          ...queued,
          startedAt: startsAt,
          completesAt: startsAt + queued.recipe.craftHours,
        };
        cursor = reflowed.completesAt;
        return reflowed;
      });
      const nextInventory = { ...state.inventory };
      if (!item.completed) {
        item.recipe.cost.forEach((req) => {
          nextInventory[req.resource] =
            (nextInventory[req.resource] || 0) + req.amount;
        });
      }
      return { inventory: nextInventory, kitchenQueue: reflowedQueue };
    });
    return true;
  },

  processKitchenQueue: () => {
    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );

    set((state) => {
      const completedItems = state.kitchenQueue.filter(
        (item) => !item.completed && item.completesAt <= now,
      );
      if (completedItems.length === 0) return state;

      const completedIds = new Set(completedItems.map((item) => item.id));
      const nextInventory = { ...state.inventory };
      const nextLogs = [...state.gameLogs];
      completedItems.forEach((item) => {
        nextInventory[item.recipe.output] =
          (nextInventory[item.recipe.output] || 0) +
          (item.recipe.outputAmount ?? 1);
        nextLogs.push(
          `🍽️ MEAL COMPLETE: ${item.recipe.name} added to inventory.`,
        );
      });

      return {
        inventory: nextInventory,
        discoveredResourceTypes: completedItems.reduce(
          (resources, item) =>
            resources.includes(item.recipe.output)
              ? resources
              : [...resources, item.recipe.output],
          state.discoveredResourceTypes,
        ),
        gameLogs: nextLogs,
        kitchenQueue: state.kitchenQueue.map((item) =>
          completedIds.has(item.id) ? { ...item, completed: true } : item,
        ),
      };
    });
  },

  // 5. Build Module Logic (Fired when clicking the React build UI)
  buildModule: (moduleId, gridX, gridY) => {
    const config = MODULES[moduleId];
    const { inventory, consumeResource } = get();
    if (!config) return false;

    // Verify build costs
    const canAfford = config.buildCost.every(
      (cost) => (inventory[cost.resource] || 0) >= cost.amount,
    );
    if (!canAfford) return false;

    // Deduct build cost
    config.buildCost.forEach((cost) =>
      consumeResource(cost.resource, cost.amount),
    );

    // Append to placed modules state tracking
    const instanceId = `${moduleId}-${Date.now()}`;
    set((state) => ({
      placedModules: [
        ...state.placedModules,
        {
          id: moduleId,
          instanceId,
          x: gridX,
          y: gridY,
          hp: config.maxIntegrity,
          active: true,
          powerSupplyEnabled: false,
        },
      ],
    }));

    // Trigger an external event dispatch so Phaser knows to render the building!
    window.dispatchEvent(
      new CustomEvent("PHASER_SPAWN_MODULE", {
        detail: { moduleId, gridX, gridY, instanceId },
      }),
    );
    return true;
  },

  toggleModule: (instanceId) => {
    set((state) => ({
      placedModules: state.placedModules.map((module) =>
        module.instanceId === instanceId && module.hp > 0
          ? { ...module, active: !module.active }
          : module,
      ),
    }));
  },

  togglePowerSupply: (instanceId) => {
    set((state) => ({
      placedModules: state.placedModules.map((module) =>
        module.instanceId === instanceId && module.id === "battery"
          ? { ...module, powerSupplyEnabled: !module.powerSupplyEnabled }
          : module,
      ),
    }));
  },

  // 6. Core Work Shifts Loop
  // executeShift: (shiftLength) => {
  //   const { advanceHour, consumeResource } = get();

  //   // Shift calculations modifier: Extended shifts consume double survival rations
  //   const consumptionMultiplier = shiftLength === 12 ? 2 : 1;
  //   const waterDeducted = consumeResource("water", 1 * consumptionMultiplier);
  //   const foodDeducted = consumeResource("food", 1 * consumptionMultiplier);

  //   if (!waterDeducted || !foodDeducted) {
  //     set((state) => ({
  //       astronautHealth: Math.max(0, state.astronautHealth - 25),
  //       gameLogs: [
  //         ...state.gameLogs,
  //         `🚨 CRITICAL: Starvation/Dehydration active! Astronaut took severe physical health hit.`,
  //       ],
  //     }));
  //   }

  //   set((state) => ({
  //     fatigueLevel:
  //       shiftLength === 12
  //         ? Math.min(100, state.fatigueLevel + 40)
  //         : Math.min(100, state.fatigueLevel + 10),
  //   }));

  //   // Trigger hourly system changes across the duration parameter
  //   advanceHour(shiftLength);

  //   // Sleep block follows work window: instantly returns fatigue tracking back to zero parameters
  //   set(() => ({
  //     fatigueLevel: 0,
  //     currentHour: 8, // reset clock back to normal morning shift hour configuration
  //   }));
  //   // Note: advancing to morning pushes day count automatically via advanceHour if cross midnight threshold
  // },
  sleepUntilMorning: () => {
    const { currentHour, isFainted, stopPassiveTimer, startPassiveTimer } =
      get();
    if (
      currentHour < IDEAL_SLEEP_HOUR ||
      (currentHour >= FAINT_HOUR && !isFainted)
    ) {
      return false;
    }

    stopPassiveTimer();
    const overtimeHours =
      currentHour >= IDEAL_SLEEP_HOUR
        ? currentHour - IDEAL_SLEEP_HOUR
        : currentHour + 24 - IDEAL_SLEEP_HOUR;
    const sleepHours = (24 - currentHour + IDEAL_WAKE_HOUR) % 24 || 24;
    get().advanceHour(sleepHours, { pauseWorkshop: true });

    set((state) => {
      const selectedFood = FOOD_PRIORITY.find(
        (food) => (state.inventory[food] || 0) > 0,
      );
      const nextWakeHour = IDEAL_WAKE_HOUR + overtimeHours;
      const nextInventory = { ...state.inventory };

      if (selectedFood) {
        nextInventory[selectedFood] -= 1;
      }

      return {
        currentHour: nextWakeHour,
        currentMinute: 0,
        nextWakeHour,
        overtimeHours,
        inventory: nextInventory,
        fatigueLevel: selectedFood
          ? Math.max(
              0,
              state.fatigueLevel - FOOD_FATIGUE_RECOVERY[selectedFood],
            )
          : state.fatigueLevel,
        astronautHealth: selectedFood
          ? Math.min(
              100,
              state.astronautHealth + FOOD_HEALTH_RECOVERY[selectedFood],
            )
          : Math.max(0, state.astronautHealth - NO_FOOD_HEALTH_LOSS),
        gameLogs: [
          ...state.gameLogs,
          selectedFood
            ? `🍽️ Night meal: ${selectedFood.replace("_", " ")} consumed.`
            : "🚨 No meal available. Astronaut health decreased.",
          overtimeHours > 0
            ? `😴 Recovery delayed by ${overtimeHours} overtime hour${overtimeHours === 1 ? "" : "s"}. Wake time: ${String(nextWakeHour).padStart(2, "0")}:00.`
            : "😴 Optimal sleep cycle complete. Wake time: 07:00.",
        ],
      };
    });

    startPassiveTimer();
    return true;
  },

  workOvertime: () => {
    const { currentHour, advanceHour } = get();
    if (currentHour < IDEAL_SLEEP_HOUR || currentHour >= FAINT_HOUR) {
      return false;
    }

    advanceHour(1);
    const nextHour = get().currentHour;

    set((state) => ({
      fatigueLevel: Math.min(
        100,
        state.fatigueLevel + OVERTIME_FATIGUE_PER_HOUR,
      ),
      overtimeHours: nextHour - IDEAL_SLEEP_HOUR,
      gameLogs: [
        ...state.gameLogs,
        `⚠️ Overtime started at ${String(currentHour).padStart(2, "0")}:00. Fatigue increased by ${OVERTIME_FATIGUE_PER_HOUR}.`,
      ],
    }));

    if (nextHour >= FAINT_HOUR) {
      set((state) => ({
        isFainted: true,
        gameLogs: [
          ...state.gameLogs,
          "💫 Astronaut fainted at 23:00 from exhaustion. Emergency sleep cycle started.",
        ],
      }));

      get().sleepUntilMorning();
      set({ isFainted: false });
    }

    return true;
  },

  // 8. Module Maintenance Action Function
  // repairModule: (instanceId) => {
  //   const { inventory, consumeResource, placedModules } = get();
  //   if ((inventory["repair_kit"] || 0) < 1) return false;

  //   const moduleObj = placedModules.find((m) => m.instanceId === instanceId);
  //   if (!moduleObj) return false;
  //   const config = MODULES[moduleObj.id];
  //   if (!config) return false;

  //   consumeResource("repair_kit", 1);
  //   set((state) => ({
  //     placedModules: state.placedModules.map((m) =>
  //       m.instanceId === instanceId ? { ...m, hp: config.maxIntegrity } : m,
  //     ),
  //   }));
  //   return true;
  // },

  repairModule: (instanceId) => {
    const {
      inventory,
      consumeResource,
      placedModules,
      stopPassiveTimer,
      advanceHour,
      startPassiveTimer,
    } = get() as any; // 🟢 ADDED "as any" CAST HERE
    if ((inventory["repair_kit"] || 0) < 1) return false;

    const moduleObj = placedModules.find(
      (m: { instanceId: string }) => m.instanceId === instanceId,
    );
    if (!moduleObj) return false;
    const config = MODULES[moduleObj.id];
    if (!config) return false;

    stopPassiveTimer();
    consumeResource("repair_kit", 1);

    set((state) => ({
      placedModules: state.placedModules.map((m) =>
        m.instanceId === instanceId ? { ...m, hp: config.maxIntegrity } : m,
      ),
    }));

    advanceHour(1);
    startPassiveTimer();
    return true;
  },

  startRepair: (instanceId) => {
    const state = get();
    const existingJob = state.repairJobs[instanceId];
    if (existingJob?.elapsedMinutes >= 60) return false;

    if (
      state.activeRepairInstanceId &&
      state.activeRepairInstanceId !== instanceId
    ) {
      state.pauseRepair(state.activeRepairInstanceId);
    }

    if (!existingJob) {
      if (!state.consumeResource("repair_kit", 1)) return false;
    }

    const now =
      state.currentDay * 24 * 60 +
      state.currentHour * 60 +
      state.currentMinute;
    set((currentState) => ({
      repairJobs: {
        ...currentState.repairJobs,
        [instanceId]: {
          elapsedMinutes: existingJob?.elapsedMinutes ?? 0,
          startedAt: now,
        },
      },
      activeRepairInstanceId: instanceId,
    }));
    return true;
  },

  pauseRepair: (instanceId) => {
    const job = get().repairJobs[instanceId];
    if (!job || job.startedAt === null) return;

    const now =
      get().currentDay * 24 * 60 +
      get().currentHour * 60 +
      get().currentMinute;
    const elapsedMinutes = Math.min(
      60,
      job.elapsedMinutes + Math.max(0, now - job.startedAt),
    );
    set((state) => ({
      repairJobs: {
        ...state.repairJobs,
        [instanceId]: { elapsedMinutes, startedAt: null },
      },
      activeRepairInstanceId:
        state.activeRepairInstanceId === instanceId
          ? null
          : state.activeRepairInstanceId,
    }));
  },

  getRepairElapsedMinutes: (instanceId) => {
    const job = get().repairJobs[instanceId];
    if (!job) return 0;
    if (job.startedAt === null) return job.elapsedMinutes;

    const now =
      get().currentDay * 24 * 60 +
      get().currentHour * 60 +
      get().currentMinute;
    return Math.min(
      60,
      job.elapsedMinutes + Math.max(0, now - job.startedAt),
    );
  },

  completeRepair: (instanceId) => {
    const moduleObj = get().placedModules.find(
      (module) => module.instanceId === instanceId,
    );
    if (!moduleObj) return false;

    const config = MODULES[moduleObj.id];
    if (!config) return false;

    set((state) => ({
      placedModules: state.placedModules.map((module) =>
        module.instanceId === instanceId
          ? { ...module, hp: config.maxIntegrity }
          : module,
      ),
      repairJobs: Object.fromEntries(
        Object.entries(state.repairJobs).filter(
          ([jobInstanceId]) => jobInstanceId !== instanceId,
        ),
      ),
      gameLogs: [
        ...state.gameLogs,
        `✅ SUCCESS: ${config.name} fully restored to nominal specs.`,
      ],
    }));
    return true;
  },

  // --- APPEND THESE TWO NEW METHODS AT THE VERY BOTTOM OF THE STORE OBJECT ---
  startPassiveTimer: () => {
    if ((get() as any).timerIntervalId) return;

    // Normal time advances one visible game minute per real-world second.
    const interval = setInterval(() => {
      const store = get() as any;
      let nextMinute = store.currentMinute + 1;

      if (nextMinute >= 60) {
        // 60 minutes have passed! Advance the base automation engine by 1 full hour
        if (store.currentHour === FAINT_HOUR - 1) {
          store.workOvertime();
        } else {
          store.advanceHour(1);
        }
        set({ currentMinute: 0 });
        store.processWorkshopQueue();
        store.processKitchenQueue();
        store.processGreenhouseQueue();
        store.processResearchQueue();
      } else {
        // Just increment the active clock minutes
        set({ currentMinute: nextMinute });
        store.processWorkshopQueue();
        store.processKitchenQueue();
        store.processGreenhouseQueue();
        store.processResearchQueue();
      }
    }, 1000);

    set({ timerIntervalId: interval });
  },

  stopPassiveTimer: () => {
    const id = (get() as any).timerIntervalId;
    if (id) {
      clearInterval(id);
      set({ timerIntervalId: null });
    }
  },

  startActiveRepairLoop: (instanceId: string) => {
    const { stopPassiveTimer, timerIntervalId, startRepair } = get();

    // 1. Guard check: Avoid duplicating intervals if already actively repairing
    if (timerIntervalId && get().activeRepairInstanceId === instanceId) return;

    if (!startRepair(instanceId)) return;

    // 2. Clear out the passive slow ticking interval loop instantly
    stopPassiveTimer();

    // Tick one visible game minute at a time so the clock fast-forwards smoothly.
    const repairInterval = setInterval(() => {
      const store = get();
      const targetInstance = store.placedModules.find(
        (module) => module.instanceId === instanceId,
      );

      if (!targetInstance) {
        store.stopActiveRepairLoop();
        return;
      }

      const nextMinute = store.currentMinute + 1;
      if (nextMinute >= 60) {
        store.advanceHour(1);
        set({ currentMinute: 0 });
      } else {
        set({ currentMinute: nextMinute });
      }

      const elapsedMinutes = store.getRepairElapsedMinutes(instanceId);

      if (elapsedMinutes >= 60) {
        store.completeRepair(instanceId);
        store.stopActiveRepairLoop();
      }
    }, 1000 / REPAIR_TIME_SPEED);

    set({ timerIntervalId: repairInterval });
  },

  stopActiveRepairLoop: () => {
    const { timerIntervalId, activeRepairInstanceId, pauseRepair } = get();
    if (activeRepairInstanceId) pauseRepair(activeRepairInstanceId);

    const id = timerIntervalId;
    if (id) {
      clearInterval(id);
      set({ timerIntervalId: null, activeRepairInstanceId: null });
      get().startPassiveTimer();
    } else if (activeRepairInstanceId) {
      set({ activeRepairInstanceId: null });
    }
  },

  // 9. Narrative Progression Interaction
  establishComms: () => {
    const { currentDay, placedModules } = get();
    const hasRadar = placedModules.some(
      (m) => m.id === "radar" && m.hp > 0 && m.active,
    );

    if (currentDay >= 15 && hasRadar) {
      set({ isCommsEstablished: true });
      set((state) => ({
        gameLogs: [
          ...state.gameLogs,
          `📡 UPLINK CONNECTED: Earth received data. Warning issued: Lethal solar storm hitting Sol 29. Outpost Beta heavy rover dispatched for Sol 30 rescue extraction!`,
        ],
      }));
      return true;
    }
    return false;
  },

  // 6. Shift Time Progression Handling
  advanceHour: (hours, options) =>
    set((state) => {
      let nextHour = state.currentHour;
      let nextDay = state.currentDay;
      let updatedModules = [...state.placedModules];
      const updatedInventory = { ...state.inventory };
      const logs = [...state.gameLogs];
      let workshopQueue = [...state.workshopQueue];
      let powerBankCharge = state.powerBankCharge;
      const healthModifier = 0;
      let lastRadiationWaveDay = state.lastRadiationWaveDay;

      if (options?.pauseWorkshop) {
        workshopQueue = workshopQueue.map((item) =>
          item.completed
            ? item
            : {
                ...item,
                startedAt: item.startedAt + hours,
                completesAt: item.completesAt + hours,
              },
        );
      }

      // Active environmental modifiers based on timeline narrative context rules
      const isStormActive = nextDay >= 10 && nextDay <= 18;

      // Loop hourly to process state changes sequentially
      for (let i = 0; i < hours; i++) {
        nextHour += 1;

        const radiationDay = nextHour >= 24 ? nextDay + 1 : nextDay;
        const radiationHour = nextHour >= 24 ? 0 : nextHour;
        const isRadiationDay =
          radiationHour >= IDEAL_WAKE_HOUR &&
          radiationHour < IDEAL_SLEEP_HOUR;
        const continuousDecayPerSol = isRadiationDay
          ? RADIATION_DAY_DECAY_PER_SOL
          : RADIATION_NIGHT_DECAY_PER_SOL;
        const towerReduction = isRadiationDay
          ? RADIATION_TOWER_DAY_REDUCTION
          : RADIATION_TOWER_NIGHT_REDUCTION;
        const radiationWaveDue =
          radiationDay - lastRadiationWaveDay >= RADIATION_WAVE_INTERVAL_DAYS;
        if (radiationWaveDue) {
          lastRadiationWaveDay = radiationDay;
        }

        const radiationTower = updatedModules.find(
          (mod) =>
            mod.id === "radiation_tower" && mod.hp > 0 && mod.active,
        );
        const towerConfig = MODULES.radiation_tower;
        const towerCenter = radiationTower
          ? {
              x: radiationTower.x + (towerConfig.w - 1) / 2,
              y: radiationTower.y + (towerConfig.h - 1) / 2,
            }
          : null;

        const isCoveredByRadiationTower = (mod: (typeof updatedModules)[number]) => {
          if (!towerCenter || mod.id === "radiation_tower") return false;
          const config = MODULES[mod.id];
          if (!config) return false;
          const moduleCenter = {
            x: mod.x + (config.w - 1) / 2,
            y: mod.y + (config.h - 1) / 2,
          };
          return (
            Math.hypot(
              moduleCenter.x - towerCenter.x,
              moduleCenter.y - towerCenter.y,
            ) <= RADIATION_TOWER_COVERAGE_RADIUS
          );
        };

        const applyRadiationDamage = (
          mod: (typeof updatedModules)[number],
          percentage: number,
        ) => {
          const config = MODULES[mod.id];
          if (!config || mod.hp <= 0) return mod;
          const reduction = isCoveredByRadiationTower(mod)
            ? towerReduction
            : 0;
          const damage =
            config.maxIntegrity * percentage * (1 - reduction);
          return { ...mod, hp: Math.max(0, mod.hp - damage) };
        };

        updatedModules = updatedModules.map((mod) =>
          applyRadiationDamage(
            mod,
            continuousDecayPerSol / 24,
          ),
        );

        if (radiationWaveDue) {
          updatedModules = updatedModules.map((mod) =>
            applyRadiationDamage(mod, RADIATION_WAVE_DAMAGE),
          );
          logs.push(
            `☢️ RADIATION WAVE: A solar radiation surge damaged exposed modules. Tower coverage reduced the damage by ${Math.round(towerReduction * 100)}%.`,
          );
        }

        // Handle Day/Night transition thresholds at Midnight
        if (nextHour >= 24) {
          nextHour = 0;
          nextDay += 1;
        }

        const isDaylight =
          nextHour >= DAYLIGHT_START_HOUR && nextHour < DAYLIGHT_END_HOUR;
        const isNightPowerInterval =
          !isDaylight || nextHour === DAYLIGHT_START_HOUR;
        if (!isDaylight) {
          updatedModules = updatedModules.map((mod) => ({
            ...mod,
            active: isNightEssential(mod.id),
            powerSupplyEnabled:
              mod.id === "battery" ? mod.hp > 0 : mod.powerSupplyEnabled,
          }));
        } else if (nextHour === DAYLIGHT_START_HOUR) {
          updatedModules = updatedModules.map((mod) =>
            mod.id === "solar" && mod.hp > 0
              ? { ...mod, active: true }
              : mod.id === "battery"
                ? { ...mod, powerSupplyEnabled: false }
                : mod,
          );
        }

        const elapsedHour = getGameHour(nextDay, nextHour);
        const completedItems = options?.pauseWorkshop
          ? []
          : workshopQueue.filter(
              (item) => !item.completed && item.completesAt <= elapsedHour,
            );
        if (completedItems.length > 0) {
          completedItems.forEach((item) => {
            updatedInventory[item.recipe.output] =
              (updatedInventory[item.recipe.output] || 0) +
              (item.recipe.outputAmount ?? 1);
            logs.push(
              `🏭 CRAFT COMPLETE: ${item.recipe.name.replace(/^[^ ]+ /, "")} added to inventory.`,
            );
          });
          const completedIds = new Set(completedItems.map((item) => item.id));
          workshopQueue = workshopQueue.map((item) =>
            completedIds.has(item.id) ? { ...item, completed: true } : item,
          );
        }

        const hasActiveItem = workshopQueue.some((item) => !item.completed);
        if (completedItems.length > 0 && hasActiveItem) {
          let cursor = elapsedHour;
          workshopQueue = workshopQueue.map((item) => {
            if (item.completed) return item;

            const startsAt = Math.max(cursor, item.startedAt);
            const updatedItem = {
              ...item,
              startedAt: startsAt,
              completesAt: startsAt + item.recipe.craftHours,
            };
            cursor = updatedItem.completesAt;
            return updatedItem;
          });
        }

        // --- PHASE 1: POWER AUDIT BALANCE VALIDATION ---
        let totalPowerGenerated = 0;
        let totalPowerConsumed = 0;
        let activeBatteryCount = 0;

        updatedModules.forEach((mod) => {
          if (mod.hp <= 0 || !mod.active) return; // Broken or manually inactive modules are offline
          const config = MODULES[mod.id];
          if (!config) return;

          if (config.powerDraw > 0) {
            // Solar efficiency drops by 90% during Sol 10-18 dust storm events
            const output =
              isNightPowerInterval
                ? 0
                : isStormActive && config.id === "solar"
                ? Math.floor(config.powerDraw * 0.1)
                : config.powerDraw;
            totalPowerGenerated += output;
          } else {
            totalPowerConsumed += Math.abs(config.powerDraw);
          }
          if (config.id === "battery") activeBatteryCount += 1;
        });

        const powerBankCapacity = getPowerBankCapacity(updatedModules);
        powerBankCharge = Math.min(powerBankCharge, powerBankCapacity);
        const powerDeficit = Math.max(
          0,
          totalPowerConsumed - totalPowerGenerated,
        );
        const canSupplyFromBattery = updatedModules.some(
          (mod) =>
            mod.id === "battery" &&
            mod.hp > 0 &&
            mod.active &&
            (mod.powerSupplyEnabled || nextHour === DAYLIGHT_START_HOUR),
        );
        const batteryDischarge = canSupplyFromBattery
          ? Math.min(powerBankCharge, powerDeficit)
          : 0;
        powerBankCharge -= batteryDischarge;
        const daylightSurplus = Math.max(
          0,
          totalPowerGenerated - totalPowerConsumed,
        );
        if (isDaylight && activeBatteryCount > 0) {
          powerBankCharge = Math.min(
            powerBankCapacity,
            powerBankCharge +
              Math.min(
                daylightSurplus,
                activeBatteryCount * POWER_BANK_CHARGE_RATE,
              ),
          );
        }
        const hasPowerSurplus =
          totalPowerGenerated + batteryDischarge >= totalPowerConsumed;

        // --- PHASE 2: RESOURCE TRANSFORMATION & CONSUMPTION COMPUTATIONS ---
        updatedModules.forEach((mod) => {
          if (mod.hp <= 0 || !mod.active) return;
          const config = MODULES[mod.id];
          if (!config) return;

          // Process Module Operational Transformations (Inputs -> Outputs)
          if (hasPowerSurplus) {
            let inputsSatisfied = true;

            // Step 1: Check if all raw structural requirements are present in the inventory
            if (config.productionInputs) {
              inputsSatisfied = config.productionInputs.every((input) => {
                return (
                  (updatedInventory[input.resource] || 0) >= input.amountPerTick
                );
              });

              // Step 2: Deduct items from inventory if requirements pass fields perfectly
              if (inputsSatisfied) {
                config.productionInputs.forEach((input) => {
                  updatedInventory[input.resource] -= input.amountPerTick;
                });
              }
            }

            // Step 3: Run output generation/extraction if grid power and inputs are available.
            // Resource rates are read from the module definition, so new driller
            // variants work without adding resource-specific game-loop logic.
            const productionOutputs = config.productionOutputs;
            if (inputsSatisfied && productionOutputs?.length) {
              const storageCapacity = getStorageCapacity(updatedModules);
              const currentInventoryTotal = getInventoryTotal(updatedInventory);
              const outputTotal = productionOutputs.reduce(
                (total, output) => total + output.amountPerTick,
                0,
              );
              const hasStorageSpace =
                currentInventoryTotal + outputTotal <= storageCapacity;

              if (hasStorageSpace) {
                productionOutputs.forEach((out) => {
                  updatedInventory[out.resource] =
                    (updatedInventory[out.resource] || 0) + out.amountPerTick;
                });
              }
            }
          }
        });

        // --- PHASE 3: ASTRONAUT ENVIRONMENTAL EXPOSURE DAMAGE MATRIX ---
      }

      // --- PHASE 4: TIMELINE NARRATIVE EVENT TRACKER LOGS ---
      if (nextDay === 10 && state.currentDay < 10)
        logs.push(
          "⚠️ WEATHER ALERT: Global dust storm tracking has crossed into sector grid coordinates. Solar arrays down to 10% production efficiency.",
        );
      if (nextDay === 15 && state.currentDay < 15 && !state.isCommsEstablished)
        logs.push(
          "📡 COMMUNICATIONS LOG: Satellite window aligned. Construct a Long-Range Radar Array module to execute Earth connectivity diagnostics.",
        );
      if (nextDay === 29 && state.currentDay < 29)
        logs.push(
          "☢️ EXTREME HAZARD WARNING: Terminal solar particle CME event striking planet surface grid. Activate Aegis Towers with queued filters instantly!",
        );
      if (nextDay === 30 && state.currentDay < 30)
        logs.push(
          "🎉 MISSION ACCOMPLISHED: Outpost Beta heavy pressurized rover crossed the ridge grid! Evacuation protocol initialized. You survived Mars.",
        );

      return {
        currentHour: nextHour,
        currentDay: nextDay,
        lastRadiationWaveDay,
        placedModules: updatedModules,
        inventory: updatedInventory,
        powerBankCharge,
        workshopQueue,
        astronautHealth: Math.max(
          0,
          Math.min(100, state.astronautHealth + healthModifier),
        ),
        gameLogs: logs,
      };
    }),
}));

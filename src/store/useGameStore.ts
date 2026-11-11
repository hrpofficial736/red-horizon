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
const POWER_BANK_CHARGE_RATE = 30;
const CRITICAL_POWER_MODULE_IDS = new Set(["habitat", "life_support"]);
export const isCriticalPowerModule = (moduleId: string) =>
  CRITICAL_POWER_MODULE_IDS.has(moduleId);

const FOOD_FATIGUE_RECOVERY = {
  soup: 5,
  meal: 15,
  good_meal: 25,
} as const;

const FOOD_HEALTH_RECOVERY = {
  soup: 7,
  meal: 12,
  good_meal: 18,
} as const;
const FOOD_PRIORITY = ["good_meal", "meal", "soup"] as const;
const OVERTIME_FATIGUE_PER_HOUR = 10;
const NO_FOOD_HEALTH_LOSS = 10;
const INITIAL_PREPARED_FOOD = 4;
const INITIAL_OXYGEN_SPO2 = 98;
const OXYGEN_CRITICAL_THRESHOLD = 90;
const OXYGEN_DRAIN_PER_HOUR = 4.5; //5
const OXYGEN_VITALS_LOSS_PER_HOUR = 6; //8
const OXYGEN_RECOVERY_PER_MINUTE = 0.2;  // 0.1
const CRITICAL_POWER_DEMAND = 17;
const SAVE_STORAGE_KEY = "project-tharsis-day-saves";
const NEW_GAME_TRANSITION_KEY = "project-tharsis-new-game-transition";
const SAVE_VERSION = 1;

const isDustStormActive = (day: number) => day >= 10 && day <= 18;

const getSolarGeneration = (powerDraw: number, day: number, hour: number) => {
  if (hour < DAYLIGHT_START_HOUR || hour >= DAYLIGHT_END_HOUR) return 0;
  return isDustStormActive(day) ? Math.floor(powerDraw * 0.9) : powerDraw;
};
export const REPAIR_TIME_SPEED = 15;
export const REPAIR_THRESHOLD_HEALTH = 80;
export const REPAIR_WARNING_HEALTH = 51;
export const REPAIR_CRITICAL_HEALTH = 16;
export const REPAIR_TIME_STANDARD_HOURS = 1;
export const REPAIR_TIME_WARNING_HOURS = 2;
export const REPAIR_TIME_CRITICAL_HOURS = 4;
// Difficulty tuning: percentages are decimal fractions of a module's max HP.
export const RADIATION_DAY_DECAY_PER_SOL = 0.05;
export const RADIATION_NIGHT_DECAY_PER_SOL = 0.075;
export const RADIATION_WAVE_DAMAGE = 0.075;
export const RADIATION_WAVE_INTERVAL_DAYS = 3;
export const RADIATION_TOWER_DAY_REDUCTION = 0.65;
export const RADIATION_TOWER_NIGHT_REDUCTION = 0.65;
export const RADIATION_TOWER_COVERAGE_RADIUS = 9999;

const isModuleFunctionallyDisabled = (module: {
  hp: number;
  constructionHoursRemaining?: number;
}) =>
  module.hp <= 0 ||
  module.hp < REPAIR_CRITICAL_HEALTH ||
  (module.constructionHoursRemaining ?? 0) > 0;

export const getPowerBankCapacity = (
  placedModules: Array<{
    id: string;
    hp: number;
    constructionHoursRemaining?: number;
  }>,
) =>
  placedModules.reduce(
    (capacity, module) =>
      capacity +
      (!isModuleFunctionallyDisabled(module)
        ? (MODULES[module.id]?.powerCapacity ?? 0)
        : 0),
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
  currentDay = 1,
) => {
  let generated = 0;
  let consumed = 0;

  placedModules.forEach((module) => {
    if (isModuleFunctionallyDisabled(module) || !module.active) return;
    const config = MODULES[module.id];
    if (!config) return;

    if (config.powerDraw > 0) {
      generated += getSolarGeneration(config.powerDraw, currentDay, currentHour);
    } else {
      consumed += Math.abs(config.powerDraw);
    }
  });

  const canSupplyFromBattery = placedModules.some(
    (module) =>
      module.id === "battery" &&
      module.hp > 0 &&
      module.active &&
      (module.powerSupplyEnabled ||
        isDustStormActive(currentDay) ||
        currentHour < DAYLIGHT_START_HOUR ||
        currentHour >= DAYLIGHT_END_HOUR),
  );

  return (
    generated >= consumed ||
    (canSupplyFromBattery && powerBankCharge >= consumed - generated)
  );
};

const isProductionOperational = (
  placedModules: Array<{
    id: string;
    hp: number;
    active: boolean;
    powerSupplyEnabled: boolean;
  }>,
  powerBankCharge: number,
  currentHour: number,
  moduleId: string,
  currentDay = 1,
) => {
  const module = placedModules.find((candidate) => candidate.id === moduleId);
  return (
    module !== undefined &&
    module.hp > 0 &&
    module.active &&
    hasOperationalPower(placedModules, powerBankCharge, currentHour, currentDay)
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
  durationMinutes: number;
}

export const getRepairDurationMinutes = (healthPercentage: number) => {
  if (healthPercentage < REPAIR_CRITICAL_HEALTH) {
    return REPAIR_TIME_CRITICAL_HOURS * 60;
  }
  if (healthPercentage < REPAIR_WARNING_HEALTH) {
    return REPAIR_TIME_WARNING_HOURS * 60;
  }
  return REPAIR_TIME_STANDARD_HOURS * 60;
};

const getGameHour = (day: number, hour: number, minute = 0) =>
  day * 24 + hour + minute / 60;

const shiftPendingQueue = (
  queue: CraftQueueItem[],
  elapsedHours: number,
) =>
  queue.map((item) =>
    item.completed
      ? item
      : {
          ...item,
          startedAt: item.startedAt + elapsedHours,
          completesAt: item.completesAt + elapsedHours,
        },
  );

const shiftPendingResearch = (
  queue: ResearchQueueItem[],
  elapsedHours: number,
) =>
  queue.map((item) => ({
    ...item,
    startedAt: item.startedAt + elapsedHours,
    completesAt: item.completesAt + elapsedHours,
  }));

export const getInventoryTotal = (
  inventory: Record<ResourceType, number>,
) => Object.values(inventory).reduce((total, amount) => total + amount, 0);

export const getStorageCapacity = (
  placedModules: Array<{ id: string; constructionHoursRemaining?: number }>,
) =>
  placedModules.reduce(
    (capacity, module) =>
      capacity +
      ((module.constructionHoursRemaining ?? 0) <= 0
        ? (MODULES[module.id]?.moduleCapacity ?? 0)
        : 0),
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
    constructionHoursRemaining?: number;
    productionPausedAt?: number;
    powerPausedAt?: number;
  }>;
  astronautHealth: number;
  oxygenSpO2: number;
  powerBankCharge: number;
  currentDay: number;
  lastRadiationWaveDay: number;
  currentHour: number;
  currentMinute: number;
  fatigueLevel: number;
  isFainted: boolean;
  gameFailed: boolean;
  failureCause: string | null;
  nextWakeHour: number;
  overtimeHours: number;
  sleepOverlayPhase: "none" | "fadeOut" | "day" | "fadeIn";
  sleepOverlayDay: number;
  sleepOverlayMode: "save" | "load";
  timerIntervalId: null | ReturnType<typeof setInterval>;
  workshopQueue: CraftQueueItem[];
  kitchenQueue: CraftQueueItem[];
  greenhouseQueue: CraftQueueItem[];
  sampleExtractorQueue: CraftQueueItem[];
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
  uplinkConnectionStartedAt: number | null;
  earthReportSent: boolean;
  stormAlertReceived: boolean;
  rescueMissionInitialized: boolean;
  criticalSystemsBootstrapped: boolean;
  gameLogs: string[]; // Narration strings push here for UI console
  foodStockpileTaskStartDay: number | null;
  foodStockpileTaskCompleted: boolean;
  radiationTowerTaskStartDay: number | null;
  startRadiationTowerTask: () => void;
  startFoodStockpileTask: () => void;
  completeFoodStockpileTask: () => void;
  saveGameAtDayStart: (day?: number) => void;
  getAvailableSaves: () => SavedGame[];
  loadGameSave: (day: number) => boolean;
  deleteSavedGames: (days: number[]) => void;
  deleteAllSavedGames: () => void;
  startNewGame: () => void;
  initializeGameSaves: () => void;

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
  queueSampleExtractorCrafting: (recipe: CraftingRecipe) => boolean;
  cancelSampleExtractorCrafting: (queueItemId: string) => boolean;
  processSampleExtractorQueue: () => void;
  queueGreenhouseCrafting: (recipe: CraftingRecipe) => boolean;
  cancelGreenhouseCrafting: (queueItemId: string) => boolean;
  processGreenhouseQueue: () => void;
  queueResearch: (node: ResearchNode) => boolean;
  cancelResearch: (queueItemId: string) => boolean;
  processResearchQueue: () => void;
  unlockModuleBlueprint: (moduleId: string) => void;
  buildModule: (moduleId: string, gridX: number, gridY: number) => boolean;
  moveModule: (instanceId: string, gridX: number, gridY: number) => boolean;
  toggleModule: (instanceId: string) => void;
  togglePowerSupply: (instanceId: string) => void;

  // // EXTENDED SYSTEM ACTIONS
  sleepUntilMorning: () => boolean;
  workOvertime: () => boolean;
  repairModule: (instanceId: string) => boolean;
  completeRepair: (instanceId: string) => boolean;
  establishComms: () => boolean;
  startUplinkConnection: () => boolean;
  processUplinkConnection: () => void;
  sendEarthReport: () => boolean;
  initializeRescueMission: () => boolean;
  advanceHour: (
    hours: number,
    options?: {
      pauseWorkshop?: boolean;
      applyRadiation?: boolean;
      processOxygen?: boolean;
    },
  ) => void;
  processOxygenMinute: () => void;
  startPassiveTimer: () => void;
  stopPassiveTimer: () => void;
}

export interface SavedGame {
  day: number;
  savedAt: string;
  state: GameSaveState;
}

interface GameSaveState {
  inventory: Record<ResourceType, number>;
  discoveredResourceTypes: ResourceType[];
  placedModules: GameState["placedModules"];
  astronautHealth: number;
  oxygenSpO2: number;
  powerBankCharge: number;
  currentDay: number;
  lastRadiationWaveDay: number;
  currentHour: number;
  currentMinute: number;
  fatigueLevel: number;
  isFainted: boolean;
  gameFailed: boolean;
  failureCause: string | null;
  nextWakeHour: number;
  overtimeHours: number;
  workshopQueue: CraftQueueItem[];
  kitchenQueue: CraftQueueItem[];
  greenhouseQueue: CraftQueueItem[];
  sampleExtractorQueue: CraftQueueItem[];
  researchQueue: ResearchQueueItem[];
  researchedNodeIds: string[];
  unlockedModuleIds: string[];
  activeRepairInstanceId: string | null;
  repairJobs: Record<string, RepairJob>;
  isCommsEstablished: boolean;
  uplinkConnectionStartedAt: number | null;
  earthReportSent: boolean;
  stormAlertReceived: boolean;
  rescueMissionInitialized: boolean;
  criticalSystemsBootstrapped: boolean;
  gameLogs: string[];
  foodStockpileTaskStartDay: number | null;
  foodStockpileTaskCompleted: boolean;
  radiationTowerTaskStartDay?: number | null;
}

const INITIAL_PLACED_MODULES: GameState["placedModules"] = [
  {
    id: "habitat",
    instanceId: "starting-habitat",
    x: 8,
    y: 9,
    hp: MODULES.habitat.maxIntegrity,
    active: true,
    powerSupplyEnabled: false,
  },
  {
    id: "life_support",
    instanceId: "starting-life-support",
    x: 8,
    y: 11,
    hp: MODULES.life_support.maxIntegrity,
    active: true,
    powerSupplyEnabled: false,
  },
];

const isBrowser = () => typeof window !== "undefined";

const readSavedGames = (): SavedGame[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (save): save is SavedGame =>
        typeof save === "object" &&
        save !== null &&
        typeof (save as SavedGame).day === "number" &&
        typeof (save as SavedGame).savedAt === "string" &&
        typeof (save as SavedGame).state === "object",
    );
  } catch {
    return [];
  }
};

const writeSavedGames = (saves: SavedGame[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    SAVE_STORAGE_KEY,
    JSON.stringify({ version: SAVE_VERSION, saves }),
  );
};

const getSaveList = (): SavedGame[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "saves" in parsed &&
      Array.isArray(parsed.saves)
    ) {
      return parsed.saves as SavedGame[];
    }
  } catch {
    return [];
  }
  return readSavedGames();
};

const getSaveState = (state: GameState): GameSaveState => ({
  inventory: state.inventory,
  discoveredResourceTypes: state.discoveredResourceTypes,
  placedModules: state.placedModules,
  astronautHealth: state.astronautHealth,
  oxygenSpO2: state.oxygenSpO2,
  powerBankCharge: state.powerBankCharge,
  currentDay: state.currentDay,
  lastRadiationWaveDay: state.lastRadiationWaveDay,
  currentHour: state.currentHour,
  currentMinute: state.currentMinute,
  fatigueLevel: state.fatigueLevel,
  isFainted: state.isFainted,
  gameFailed: state.gameFailed,
  failureCause: state.failureCause,
  nextWakeHour: state.nextWakeHour,
  overtimeHours: state.overtimeHours,
  workshopQueue: state.workshopQueue,
  kitchenQueue: state.kitchenQueue,
  greenhouseQueue: state.greenhouseQueue,
  sampleExtractorQueue: state.sampleExtractorQueue,
  researchQueue: state.researchQueue,
  researchedNodeIds: state.researchedNodeIds,
  unlockedModuleIds: state.unlockedModuleIds,
  activeRepairInstanceId: state.activeRepairInstanceId,
  repairJobs: state.repairJobs,
  isCommsEstablished: state.isCommsEstablished,
  uplinkConnectionStartedAt: state.uplinkConnectionStartedAt,
  earthReportSent: state.earthReportSent,
  stormAlertReceived: state.stormAlertReceived,
  rescueMissionInitialized: state.rescueMissionInitialized,
  criticalSystemsBootstrapped: state.criticalSystemsBootstrapped,
  gameLogs: state.gameLogs,
  foodStockpileTaskStartDay: state.foodStockpileTaskStartDay,
  foodStockpileTaskCompleted: state.foodStockpileTaskCompleted,
  radiationTowerTaskStartDay: state.radiationTowerTaskStartDay,
});

const notifyPhaserOfModules = (placedModules: GameState["placedModules"]) => {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent("PHASER_SYNC_MODULES", {
      detail: { modules: placedModules },
    }),
  );
};

export const useGameStore = create<GameState>((set, get) => ({
  // 1. Initial State Definitions
  inventory: {
    iron_ore: 16,
    silicates: 18,
    iron_plate: 34,
    glass_panel: 14,
    electronics: 24,
    repair_kit: 3,
    water_filter: 0,
    air_filter: 0,
    water: 18,
    raw_food: 8,
    soup: INITIAL_PREPARED_FOOD,
    meal: 0,
    good_meal: 0,
    mars_sample: 0,
  },
  discoveredResourceTypes: STARTING_DISCOVERED_RESOURCES,

  queueGreenhouseCrafting: (recipe) => {
    const { inventory, greenhouseQueue, placedModules, powerBankCharge, currentHour } =
      get();
    if (
      !isProductionOperational(
        placedModules,
        powerBankCharge,
        currentHour,
        "greenhouse",
      )
    ) {
      return false;
    }
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
      if (
        !isProductionOperational(
          state.placedModules,
          state.powerBankCharge,
          state.currentHour,
          "greenhouse",
        )
      ) {
        return state;
      }
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
  placedModules: INITIAL_PLACED_MODULES,
  astronautHealth: 100,
  oxygenSpO2: INITIAL_OXYGEN_SPO2,
  powerBankCharge: 0,
  currentDay: 1,
  lastRadiationWaveDay: 1,
  currentHour: 7, // The ideal work day starts at 07:00
  currentMinute: 0,
  isFainted: false,
  gameFailed: false,
  failureCause: null,
  nextWakeHour: IDEAL_WAKE_HOUR,
  overtimeHours: 0,
  sleepOverlayPhase: "none",
  sleepOverlayDay: 1,
  sleepOverlayMode: "save",

  timerIntervalId: null,
  workshopQueue: [],
  kitchenQueue: [],
  greenhouseQueue: [],
  sampleExtractorQueue: [],
  researchQueue: [],
  researchedNodeIds: [],
  activeRepairInstanceId: null,
  repairJobs: {},

  // // NEW MECHANICS STATE
  fatigueLevel: 0,
  isCommsEstablished: false,
  uplinkConnectionStartedAt: null,
  earthReportSent: false,
  stormAlertReceived: false,
  rescueMissionInitialized: false,
  criticalSystemsBootstrapped: true,
  foodStockpileTaskStartDay: null,
  foodStockpileTaskCompleted: false,
  radiationTowerTaskStartDay: null,
  gameLogs: [
    "Sol 01: System online. Establish base foundations before environmental anomalies manifest.",
  ],

  startRadiationTowerTask: () => {
    if (get().radiationTowerTaskStartDay !== null) return;
    set({ radiationTowerTaskStartDay: get().currentDay });
  },

  startFoodStockpileTask: () => {
    if (get().foodStockpileTaskStartDay !== null) return;
    set({ foodStockpileTaskStartDay: get().currentDay });
  },

  completeFoodStockpileTask: () => {
    if (get().foodStockpileTaskCompleted) return;
    set({ foodStockpileTaskCompleted: true });
  },

  saveGameAtDayStart: (day) => {
    const state = get();
    const saveDay = day ?? state.currentDay;
    const save: SavedGame = {
      day: saveDay,
      savedAt: new Date().toISOString(),
      state: getSaveState(state),
    };
    const saves = getSaveList().filter((entry) => entry.day !== saveDay);
    writeSavedGames([...saves, save].sort((a, b) => a.day - b.day));
  },

  getAvailableSaves: () => {
    const currentDay = get().currentDay;
    const includeCurrentDay = get().gameFailed;
    return getSaveList()
      .filter((save) => (includeCurrentDay ? save.day <= currentDay : save.day < currentDay))
      .sort((a, b) => b.day - a.day);
  },

  deleteSavedGames: (days) => {
    if (days.length === 0) return;
    const daysToDelete = new Set(days);
    writeSavedGames(getSaveList().filter((save) => !daysToDelete.has(save.day)));
  },

  deleteAllSavedGames: () => {
    if (isBrowser()) window.localStorage.removeItem(SAVE_STORAGE_KEY);
  },

  startNewGame: () => {
    if (isBrowser()) {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
      window.localStorage.setItem(NEW_GAME_TRANSITION_KEY, "true");
      window.location.reload();
    }
  },

  loadGameSave: (day) => {
    const save = getSaveList().find((entry) => entry.day === day);
    if (!save) return false;
    const placedModules =
      save.day === 1 && save.state.placedModules.length === 0
        ? INITIAL_PLACED_MODULES
        : save.state.placedModules;
    set((state) => ({
      ...save.state,
      placedModules,
      foodStockpileTaskStartDay: save.state.foodStockpileTaskStartDay ?? null,
      foodStockpileTaskCompleted:
        save.state.foodStockpileTaskCompleted ?? false,
      radiationTowerTaskStartDay: save.state.radiationTowerTaskStartDay ?? null,
      gameFailed: false,
      failureCause: null,
      uplinkConnectionStartedAt: save.state.uplinkConnectionStartedAt ?? null,
      earthReportSent: save.state.earthReportSent ?? false,
      stormAlertReceived: save.state.stormAlertReceived ?? false,
      rescueMissionInitialized: save.state.rescueMissionInitialized ?? false,
      sampleExtractorQueue: save.state.sampleExtractorQueue ?? [],
      sleepOverlayPhase: "fadeOut",
      sleepOverlayDay: save.state.currentDay,
      sleepOverlayMode: "load",
      timerIntervalId: state.timerIntervalId,
    }));
    notifyPhaserOfModules(save.state.placedModules);
    window.setTimeout(() => {
      set({ sleepOverlayPhase: "day" });
      window.setTimeout(() => {
        set({ sleepOverlayPhase: "fadeIn" });
        window.setTimeout(() => {
          set({ sleepOverlayPhase: "none" });
          if (!get().gameFailed) get().startPassiveTimer();
        }, 1000);
      }, 1500);
    }, 700);
    return true;
  },

  initializeGameSaves: () => {
    const newGameTransition =
      isBrowser() &&
      window.localStorage.getItem(NEW_GAME_TRANSITION_KEY) === "true";
    if (newGameTransition) {
      window.localStorage.removeItem(NEW_GAME_TRANSITION_KEY);
    }
    const saves = getSaveList();
    if (saves.length === 0) {
      get().saveGameAtDayStart(1);
      if (newGameTransition) {
        get().loadGameSave(1);
      }
      return;
    }
    const latestSave = [...saves].sort((a, b) => b.day - a.day)[0];
    get().loadGameSave(latestSave.day);
  },

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
    const {
      researchQueue,
      inventory,
      researchedNodeIds,
      placedModules,
      powerBankCharge,
      currentHour,
    } = get();
    if (
      !isProductionOperational(
        placedModules,
        powerBankCharge,
        currentHour,
        "researchLab",
      )
    ) {
      return false;
    }
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
      if (
        !isProductionOperational(
          state.placedModules,
          state.powerBankCharge,
          state.currentHour,
          "researchLab",
        )
      ) {
        return state;
      }
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
    const { inventory, workshopQueue, placedModules, powerBankCharge, currentHour, currentDay } =
      get();
    if (
      !isProductionOperational(
        placedModules,
        powerBankCharge,
        currentHour,
        "workshop",
        currentDay,
      )
    ) {
      return false;
    }
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
      if (
        !isProductionOperational(
          state.placedModules,
          state.powerBankCharge,
          state.currentHour,
          "workshop",
          state.currentDay,
        )
      ) {
        return state;
      }

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
    const { inventory, kitchenQueue, placedModules, powerBankCharge, currentHour } =
      get();
    if (
      !isProductionOperational(
        placedModules,
        powerBankCharge,
        currentHour,
        "kitchen",
      )
    ) {
      return false;
    }
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
      if (
        !isProductionOperational(
          state.placedModules,
          state.powerBankCharge,
          state.currentHour,
          "kitchen",
        )
      ) {
        return state;
      }
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

  queueSampleExtractorCrafting: (recipe) => {
    const {
      inventory,
      sampleExtractorQueue,
      placedModules,
      powerBankCharge,
      currentHour,
      currentDay,
    } = get();
    if (
      !isProductionOperational(
        placedModules,
        powerBankCharge,
        currentHour,
        "sample_extractor",
        currentDay,
      )
    ) {
      return false;
    }
    const hasMaterials = recipe.cost.every(
      (req) => (inventory[req.resource] || 0) >= req.amount,
    );
    if (!hasMaterials) return false;

    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );
    const lastItem = [...sampleExtractorQueue]
      .reverse()
      .find((queued) => !queued.completed);
    const startsAt = lastItem ? lastItem.completesAt : now;
    const item: CraftQueueItem = {
      id: `sample-extractor-${recipe.output}-${Date.now()}-${Math.random()
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
        sampleExtractorQueue: [...state.sampleExtractorQueue, item],
      };
    });
    return true;
  },

  cancelSampleExtractorCrafting: (queueItemId) => {
    const item = get().sampleExtractorQueue.find(
      (queued) => queued.id === queueItemId,
    );
    if (!item) return false;

    set((state) => {
      const cancelledIndex = state.sampleExtractorQueue.findIndex(
        (queued) => queued.id === queueItemId,
      );
      if (cancelledIndex < 0) return state;

      const nextQueue = state.sampleExtractorQueue.filter(
        (queued) => queued.id !== queueItemId,
      );
      const now = getGameHour(
        state.currentDay,
        state.currentHour,
        state.currentMinute,
      );
      const activeIndex = state.sampleExtractorQueue.findIndex(
        (queued) => !queued.completed,
      );
      const shouldStartNextImmediately = cancelledIndex === activeIndex;
      let cursor = shouldStartNextImmediately ? now : null;
      const reflowedQueue = nextQueue.map((queued) => {
        if (queued.completed) return queued;

        const originalIndex = state.sampleExtractorQueue.findIndex(
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
      return { inventory: nextInventory, sampleExtractorQueue: reflowedQueue };
    });
    return true;
  },

  processSampleExtractorQueue: () => {
    const now = getGameHour(
      get().currentDay,
      get().currentHour,
      get().currentMinute,
    );

    set((state) => {
      if (
        !isProductionOperational(
          state.placedModules,
          state.powerBankCharge,
          state.currentHour,
          "sample_extractor",
          state.currentDay,
        )
      ) {
        return state;
      }
      const completedItems = state.sampleExtractorQueue.filter(
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
          `🔬 EXTRACTION COMPLETE: ${item.recipe.name} secured in inventory.`,
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
        sampleExtractorQueue: state.sampleExtractorQueue.map((item) =>
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
    set((state) => {
      const isDaylightNow =
        state.currentHour >= DAYLIGHT_START_HOUR &&
        state.currentHour < DAYLIGHT_END_HOUR;
      const shouldBootstrapCriticalSystems =
        !state.criticalSystemsBootstrapped &&
        moduleId === "solar" &&
        isDaylightNow &&
        (config.constructionHours ?? 4) <= 0;

      const provisionalActive = false;

      const provisionalModules = [
        ...state.placedModules,
        {
          id: moduleId,
          instanceId,
          x: gridX,
          y: gridY,
          hp: config.maxIntegrity,
          active: provisionalActive,
          powerSupplyEnabled: false,
          constructionHoursRemaining: config.constructionHours ?? 4,
          powerPausedAt: undefined,
        },
      ];

      const shouldDisableNewModuleForCriticalPower =
        !isCriticalPowerModule(moduleId) &&
        config.powerDraw < 0 &&
        provisionalActive &&
        !hasOperationalPower(
          provisionalModules.map((module) =>
            shouldBootstrapCriticalSystems &&
            isCriticalPowerModule(module.id) &&
            module.hp > 0
              ? { ...module, active: true }
              : module,
          ),
          state.powerBankCharge,
          state.currentHour,
          state.currentDay,
        );

      const nextPlacedModules = provisionalModules.map((module) =>
        shouldBootstrapCriticalSystems &&
        isCriticalPowerModule(module.id) &&
        module.hp > 0
          ? { ...module, active: true }
          : shouldDisableNewModuleForCriticalPower &&
              module.instanceId === instanceId
            ? {
                ...module,
                active: false,
                powerPausedAt: getGameHour(
                  state.currentDay,
                  state.currentHour,
                  state.currentMinute,
                ),
              }
          : module,
      );

      return {
        placedModules: nextPlacedModules,
        criticalSystemsBootstrapped:
          state.criticalSystemsBootstrapped || shouldBootstrapCriticalSystems,
        gameLogs: shouldBootstrapCriticalSystems
          ? [
              ...state.gameLogs,
              "🔋 BOOTSTRAP: Habitat and life support came online after first solar power initialization.",
            ]
          : state.gameLogs,
      };
    });

    // Trigger an external event dispatch so Phaser knows to render the building!
    window.dispatchEvent(
      new CustomEvent("PHASER_SPAWN_MODULE", {
        detail: { moduleId, gridX, gridY, instanceId },
      }),
    );
    return true;
  },

  moveModule: (instanceId, gridX, gridY) => {
    const module = get().placedModules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (!module) return false;

    set((state) => ({
      placedModules: state.placedModules.map((candidate) =>
        candidate.instanceId === instanceId
          ? { ...candidate, x: gridX, y: gridY }
          : candidate,
      ),
    }));
    return true;
  },

  toggleModule: (instanceId) => {
    set((state) => {
      const now = getGameHour(
        state.currentDay,
        state.currentHour,
        state.currentMinute,
      );
      const module = state.placedModules.find(
        (candidate) => candidate.instanceId === instanceId,
      );
      if (!module || module.hp <= 0 || module.hp < REPAIR_CRITICAL_HEALTH) return state;
      if ((MODULES[module.id]?.powerDraw ?? 0) > 0) return state;
      if (isCriticalPowerModule(module.id)) return state;

      const active = !module.active;
      if (
        active &&
        MODULES[module.id]?.powerDraw < 0 &&
        !hasOperationalPower(
            state.placedModules.map((candidate) =>
              candidate.instanceId === instanceId
                ? { ...candidate, active: true }
                : candidate,
            ),
            state.powerBankCharge,
            state.currentHour,
            state.currentDay,
          )
      ) {
        return state;
      }
      const elapsedPausedHours =
        module.productionPausedAt === undefined
          ? 0
          : Math.max(0, now - module.productionPausedAt);
      const nextState = {
        placedModules: state.placedModules.map((candidate) =>
          candidate.instanceId === instanceId
            ? {
                ...candidate,
                active,
                productionPausedAt: active ? undefined : now,
                powerPausedAt: active ? undefined : candidate.powerPausedAt,
              }
            : candidate,
        ),
      };

      if (!active || elapsedPausedHours === 0) return nextState;
      if (module.id === "workshop") {
        return {
          ...nextState,
          workshopQueue: shiftPendingQueue(
            state.workshopQueue,
            elapsedPausedHours,
          ),
        };
      }
      if (module.id === "kitchen") {
        return {
          ...nextState,
          kitchenQueue: shiftPendingQueue(
            state.kitchenQueue,
            elapsedPausedHours,
          ),
        };
      }
      if (module.id === "greenhouse") {
        return {
          ...nextState,
          greenhouseQueue: shiftPendingQueue(
            state.greenhouseQueue,
            elapsedPausedHours,
          ),
        };
      }
      if (module.id === "sample_extractor") {
        return {
          ...nextState,
          sampleExtractorQueue: shiftPendingQueue(
            state.sampleExtractorQueue,
            elapsedPausedHours,
          ),
        };
      }
      if (module.id === "researchLab") {
        return {
          ...nextState,
          researchQueue: shiftPendingResearch(
            state.researchQueue,
            elapsedPausedHours,
          ),
        };
      }
      return nextState;
    });
  },

  togglePowerSupply: (instanceId) => {
    set((state) => {
      const isNight =
        state.currentHour < DAYLIGHT_START_HOUR ||
        state.currentHour >= DAYLIGHT_END_HOUR;
      return {
        placedModules: state.placedModules.map((module) =>
          module.instanceId === instanceId && module.id === "battery"
            ? {
                ...module,
                powerSupplyEnabled: isNight
                  ? true
                  : !module.powerSupplyEnabled,
              }
            : module,
        ),
      };
    });
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
    const targetDay = get().currentDay + 1;
    set({
      sleepOverlayPhase: "fadeOut",
      sleepOverlayDay: targetDay,
      sleepOverlayMode: "save",
    });
    const overtimeHours =
      currentHour >= IDEAL_SLEEP_HOUR
        ? currentHour - IDEAL_SLEEP_HOUR
        : currentHour + 24 - IDEAL_SLEEP_HOUR;
    const sleepHours = (24 - currentHour + IDEAL_WAKE_HOUR) % 24 || 24;
    window.setTimeout(() => {
      get().advanceHour(sleepHours, {
        pauseWorkshop: true,
        processOxygen: true,
      });

      set((state) => {
        const selectedFood = FOOD_PRIORITY.find(
          (food) => (state.inventory[food] || 0) > 0,
        );
        const hasFoodInfrastructure = ["kitchen", "greenhouse"].every(
          (moduleId) =>
            state.placedModules.some(
              (module) =>
                module.id === moduleId &&
                module.hp > 0 &&
                (module.constructionHoursRemaining ?? 0) <= 0,
            ),
        );
        const nextWakeHour = IDEAL_WAKE_HOUR + overtimeHours;
        const nextInventory = { ...state.inventory };

        if (selectedFood) {
          nextInventory[selectedFood] -= 1;
        }

        const nextHealth = selectedFood
          ? Math.min(
              100,
              state.astronautHealth + FOOD_HEALTH_RECOVERY[selectedFood],
            )
          : hasFoodInfrastructure
            ? state.astronautHealth
            : Math.max(0, state.astronautHealth - NO_FOOD_HEALTH_LOSS);
        const failedFromStarvation = nextHealth <= 0;
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
          astronautHealth: nextHealth,
          isFainted: false,
          gameFailed: failedFromStarvation,
          failureCause: failedFromStarvation
            ? "The astronaut exhausted the prepared food reserve and could not survive another night without a meal."
            : state.failureCause,
          sleepOverlayPhase: "day",
          gameLogs: [
            ...state.gameLogs,
            selectedFood
              ? `🍽️ Night meal: ${selectedFood.replace("_", " ")} consumed.`
              : hasFoodInfrastructure
                ? "🥬 No prepared meal available. Food production systems are online; continue cultivating and processing supplies."
                : "🚨 No meal available. Astronaut health decreased.",
            overtimeHours > 0
              ? `😴 Recovery delayed by ${overtimeHours} overtime hour${overtimeHours === 1 ? "" : "s"}. Wake time: ${String(nextWakeHour).padStart(2, "0")}:00.`
              : "😴 Optimal sleep cycle complete. Wake time: 07:00.",
            ...(failedFromStarvation
              ? [
                  "💀 MISSION FAILED: Astronaut health reached zero after the food reserve was exhausted.",
                ]
              : []),
          ],
        };
      });
      get().saveGameAtDayStart(get().currentDay);

      window.setTimeout(() => {
        set({ sleepOverlayPhase: "fadeIn" });
        window.setTimeout(() => {
          set({ sleepOverlayPhase: "none" });
          if (!get().gameFailed) startPassiveTimer();
        }, 1000);
      }, 2500);
    }, 1000);
    return true;
  },

  workOvertime: () => {
    const { currentHour, advanceHour } = get();
    if (currentHour < IDEAL_SLEEP_HOUR || currentHour >= FAINT_HOUR) {
      return false;
    }

    advanceHour(1, { processOxygen: true });
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

  processOxygenMinute: () => {
    set((state) => {
      if (state.gameFailed) return state;
      const habitat = state.placedModules.find(
        (module) => module.id === "habitat",
      );
      const lifeSupport = state.placedModules.find(
        (module) => module.id === "life_support",
      );
      const criticalModulesOnline =
        habitat !== undefined &&
        habitat.hp > 0 &&
        habitat.active &&
        lifeSupport !== undefined &&
        lifeSupport.hp > 0 &&
        lifeSupport.active;
      const solarGeneration = state.placedModules.reduce((total, module) => {
        const config = MODULES[module.id];
        return config &&
          config.powerDraw > 0 &&
          module.active &&
          module.hp > 0
          ? total +
              getSolarGeneration(
                config.powerDraw,
                state.currentDay,
                state.currentHour,
              )
          : total;
      }, 0);
      const criticalDemand =
        Math.abs(MODULES.habitat.powerDraw) +
        Math.abs(MODULES.life_support.powerDraw);
      const criticalPowerAvailable =
        solarGeneration >= criticalDemand ||
        state.powerBankCharge >= criticalDemand;
      const powered = criticalModulesOnline && criticalPowerAvailable;
      const oxygenSpO2 = Math.max(
        0,
        Math.min(
          100,
          state.oxygenSpO2 +
            (powered
              ? OXYGEN_RECOVERY_PER_MINUTE
              : -OXYGEN_DRAIN_PER_HOUR / 60),
        ),
      );
      const belowThreshold =
        oxygenSpO2 < OXYGEN_CRITICAL_THRESHOLD;
      const astronautHealth = belowThreshold
        ? Math.max(0, state.astronautHealth - OXYGEN_VITALS_LOSS_PER_HOUR / 60)
        : state.astronautHealth;
      const gameFailed = astronautHealth <= 0;
      return {
        oxygenSpO2,
        astronautHealth,
        gameFailed,
        failureCause: gameFailed
          ? "Life support remained without sufficient power. SpO2 fell below the safe limit and the astronaut's vitals reached zero."
          : state.failureCause,
      };
    });
    if (get().gameFailed) get().stopPassiveTimer();
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
    const module = state.placedModules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (!module) return false;
    const maxIntegrity = MODULES[module.id]?.maxIntegrity ?? 100;
    const healthPercentage = (module.hp / maxIntegrity) * 100;
    if (healthPercentage >= REPAIR_THRESHOLD_HEALTH) return false;

    const existingJob = state.repairJobs[instanceId];
    const durationMinutes =
      existingJob?.durationMinutes ??
      getRepairDurationMinutes(healthPercentage);
    if (existingJob?.elapsedMinutes >= durationMinutes) return false;
    if (state.currentHour >= FAINT_HOUR) return false;

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
          durationMinutes,
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
      job.durationMinutes,
      job.elapsedMinutes + Math.max(0, now - job.startedAt),
    );
    set((state) => ({
      repairJobs: {
        ...state.repairJobs,
        [instanceId]: {
          ...job,
          elapsedMinutes,
          startedAt: null,
        },
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
      job.durationMinutes,
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
          ? {
              ...module,
              hp: config.maxIntegrity,
              active: isCriticalPowerModule(module.id)
                ? state.criticalSystemsBootstrapped
                : config.powerDraw > 0
                  ? state.currentHour >= DAYLIGHT_START_HOUR &&
                    state.currentHour < DAYLIGHT_END_HOUR
                  : true,
              powerSupplyEnabled:
                module.id === "battery"
                  ? state.currentHour < DAYLIGHT_START_HOUR ||
                    state.currentHour >= DAYLIGHT_END_HOUR
                  : module.powerSupplyEnabled,
            }
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
          store.processOxygenMinute();
          store.workOvertime();
        } else {
          store.processOxygenMinute();
          store.advanceHour(1);
        }
        set({ currentMinute: 0 });
        store.processUplinkConnection();
        store.processWorkshopQueue();
        store.processKitchenQueue();
        store.processGreenhouseQueue();
        store.processResearchQueue();
        store.processSampleExtractorQueue();
      } else {
        // Just increment the active clock minutes
        store.processOxygenMinute();
        set({ currentMinute: nextMinute });
        store.processWorkshopQueue();
        store.processKitchenQueue();
        store.processGreenhouseQueue();
        store.processResearchQueue();
        store.processSampleExtractorQueue();
        store.processUplinkConnection();
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

      if (store.currentHour >= FAINT_HOUR) {
        store.stopActiveRepairLoop();
        return;
      }

      const nextMinute = store.currentMinute + 1;
      if (store.currentHour === FAINT_HOUR - 1 && nextMinute >= 60) {
        store.stopActiveRepairLoop();
        return;
      }

      if (nextMinute >= 60) {
        store.advanceHour(1);
        set({ currentMinute: 0 });
      } else {
        set({ currentMinute: nextMinute });
      }

      const elapsedMinutes = store.getRepairElapsedMinutes(instanceId);

      const repairJob = store.repairJobs[instanceId];
      if (repairJob && elapsedMinutes >= repairJob.durationMinutes) {
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
    return get().startUplinkConnection();
  },

  startUplinkConnection: () => {
    const { placedModules, isCommsEstablished, uplinkConnectionStartedAt } =
      get();
    if (isCommsEstablished) return true;
    if (uplinkConnectionStartedAt !== null) return true;
    const hasRadar = placedModules.some(
      (m) =>
        m.id === "radar" &&
        m.hp > 0 &&
        m.active &&
        (m.constructionHoursRemaining ?? 0) <= 0,
    );
    const hasUplink = placedModules.some(
      (m) =>
        m.id === "communication" &&
        m.hp > 0 &&
        m.active &&
        (m.constructionHoursRemaining ?? 0) <= 0,
    );

    if (hasRadar && hasUplink) {
      const startedAt = getGameHour(
        get().currentDay,
        get().currentHour,
        get().currentMinute,
      ) * 60;
      set({
        uplinkConnectionStartedAt: startedAt,
        gameLogs: [
          ...get().gameLogs,
          "📡 UPLINK HANDSHAKE: Radar lock acquired. Establishing a 30-minute encrypted channel with Earth.",
        ],
      });
      return true;
    }
    return false;
  },

  processUplinkConnection: () => {
    const { uplinkConnectionStartedAt, isCommsEstablished } = get();
    if (isCommsEstablished || uplinkConnectionStartedAt === null) return;
    const now =
      getGameHour(get().currentDay, get().currentHour, get().currentMinute) *
      60;
    if (now - uplinkConnectionStartedAt < 30) return;
    set((state) => ({
      isCommsEstablished: true,
      uplinkConnectionStartedAt: null,
      gameLogs: [
        ...state.gameLogs,
        "📡 UPLINK ESTABLISHED: Earth confirms the channel is stable. Send the outpost status report to receive mission control guidance.",
      ],
    }));
  },

  sendEarthReport: () => {
    const { isCommsEstablished, earthReportSent } = get();
    if (!isCommsEstablished || earthReportSent) return earthReportSent;
    set((state) => ({
      earthReportSent: true,
      stormAlertReceived: true,
      gameLogs: [
        ...state.gameLogs,
        "🌍 EARTH REPORT RECEIVED: Mission Control confirms a severe radiation storm will reach the outpost soon. Research and build a sample extractor, secure one sample, and deploy a rescue beacon.",
      ],
    }));
    return true;
  },

  initializeRescueMission: () => {
    const { stormAlertReceived, rescueMissionInitialized, inventory, placedModules } =
      get();
    const hasBeacon = placedModules.some(
      (module) =>
        module.id === "beacon" &&
        module.hp > 0 &&
        (module.constructionHoursRemaining ?? 0) <= 0,
    );
    if (
      !stormAlertReceived ||
      rescueMissionInitialized ||
      (inventory.mars_sample ?? 0) < 1 ||
      !hasBeacon
    ) {
      return false;
    }
    set((state) => ({
      rescueMissionInitialized: true,
      gameLogs: [
        ...state.gameLogs,
        "🚀 ARES-7 RESCUE INITIALIZED: Sample manifest received and beacon is transmitting. Hold the outpost through the evacuation window.",
      ],
    }));
    return true;
  },

  // 6. Shift Time Progression Handling
  advanceHour: (hours, options) => {
    const previousDay = get().currentDay;
    set((state) => {
      let nextHour = state.currentHour;
      let nextDay = state.currentDay;
      let updatedModules = [...state.placedModules];
      const updatedInventory = { ...state.inventory };
      const logs = [...state.gameLogs];
      let workshopQueue = [...state.workshopQueue];
      let kitchenQueue = [...state.kitchenQueue];
      let greenhouseQueue = [...state.greenhouseQueue];
      let sampleExtractorQueue = [...state.sampleExtractorQueue];
      let researchQueue = [...state.researchQueue];
      let powerBankCharge = state.powerBankCharge;
      const healthModifier = 0;
      let lastRadiationWaveDay = state.lastRadiationWaveDay;
      let criticalSystemsBootstrapped = state.criticalSystemsBootstrapped;
      let oxygenSpO2 = state.oxygenSpO2;
      let astronautHealth = state.astronautHealth;
      let oxygenFailureCause = state.failureCause;

      // Active environmental modifiers based on timeline narrative context rules
        // Loop hourly to process state changes sequentially
      for (let i = 0; i < hours; i++) {
        const wasDaylight =
          nextHour >= DAYLIGHT_START_HOUR && nextHour < DAYLIGHT_END_HOUR;
        nextHour += 1;
        updatedModules = updatedModules.map((mod) => {
          const remaining = mod.constructionHoursRemaining;
          if (remaining === undefined || remaining <= 0) return mod;
          const nextRemaining = Math.max(0, remaining - 1);
          if (nextRemaining > 0) {
            return { ...mod, active: false, constructionHoursRemaining: nextRemaining };
          }
          const config = MODULES[mod.id];
          const isDaylight =
            nextHour >= DAYLIGHT_START_HOUR && nextHour < DAYLIGHT_END_HOUR;
          return {
            ...mod,
            constructionHoursRemaining: 0,
            active: isCriticalPowerModule(mod.id)
              ? true
              : config?.powerDraw > 0
                ? isDaylight
                : mod.id === "battery",
          };
        });
        if (
          !criticalSystemsBootstrapped &&
          updatedModules.some(
            (mod) =>
              mod.id === "solar" &&
              (mod.constructionHoursRemaining ?? 0) <= 0,
          )
        ) {
          criticalSystemsBootstrapped = true;
        }

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
          return true;
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
          const hp = Math.max(0, mod.hp - damage);
          const shouldDisableForRepair = hp <= 0 || hp < REPAIR_CRITICAL_HEALTH;
          return {
            ...mod,
            hp,
            active: shouldDisableForRepair
              ? false
              : isCriticalPowerModule(mod.id)
                ? criticalSystemsBootstrapped
                : mod.active,
          };
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
        const isNightPowerInterval = !isDaylight;
        const isStormActiveThisHour = isDustStormActive(nextDay);
        const isNightfall = wasDaylight && !isDaylight;
        const isWakeup = !wasDaylight && isDaylight;
        updatedModules = updatedModules.map((mod) => {
          const config = MODULES[mod.id];
          if (mod.constructionHoursRemaining && mod.constructionHoursRemaining > 0) {
            return { ...mod, active: false };
          }
          if (config?.powerDraw > 0) {
            return {
              ...mod,
              active: mod.hp > 0 && mod.hp >= REPAIR_CRITICAL_HEALTH && isDaylight,
            };
          }
          if (mod.id === "battery") {
            return {
              ...mod,
              active: mod.hp > 0 && mod.hp >= REPAIR_CRITICAL_HEALTH,
              powerSupplyEnabled: !isDaylight,
            };
          }
          if (!isCriticalPowerModule(mod.id) && mod.id !== "battery") {
            if (!isNightfall && !isWakeup) return mod;
            return {
              ...mod,
              active: false,
              powerPausedAt: getGameHour(nextDay, nextHour),
              productionPausedAt: getGameHour(nextDay, nextHour),
            };
          }
          return mod;
        });
        if (isWakeup) {
          updatedModules = updatedModules.map((mod) =>
            isCriticalPowerModule(mod.id) || mod.id === "battery"
              ? mod
              : MODULES[mod.id]?.powerDraw > 0
                ? { ...mod, active: true }
                : {
                    ...mod,
                    active: false,
                    powerPausedAt: getGameHour(nextDay, nextHour),
                    productionPausedAt: getGameHour(nextDay, nextHour),
                  },
          );
        }

        const elapsedHour = getGameHour(nextDay, nextHour);
        const workshopOperational = isProductionOperational(
          updatedModules,
          powerBankCharge,
          nextHour,
          "workshop",
          nextDay,
        );
        const completedItems = options?.pauseWorkshop || !workshopOperational
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

        const sampleExtractorOperational = isProductionOperational(
          updatedModules,
          powerBankCharge,
          nextHour,
          "sample_extractor",
          nextDay,
        );
        const completedSampleItems = !sampleExtractorOperational
          ? []
          : sampleExtractorQueue.filter(
              (item) => !item.completed && item.completesAt <= elapsedHour,
            );
        if (completedSampleItems.length > 0) {
          completedSampleItems.forEach((item) => {
            updatedInventory[item.recipe.output] =
              (updatedInventory[item.recipe.output] || 0) +
              (item.recipe.outputAmount ?? 1);
            logs.push(
              `🔬 EXTRACTION COMPLETE: ${item.recipe.name} secured in inventory.`,
            );
          });
          const completedSampleIds = new Set(
            completedSampleItems.map((item) => item.id),
          );
          sampleExtractorQueue = sampleExtractorQueue.map((item) =>
            completedSampleIds.has(item.id) ? { ...item, completed: true } : item,
          );
        }

        const hasActiveSampleItem = sampleExtractorQueue.some(
          (item) => !item.completed,
        );
        if (completedSampleItems.length > 0 && hasActiveSampleItem) {
          let cursor = elapsedHour;
          sampleExtractorQueue = sampleExtractorQueue.map((item) => {
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
              config.id === "solar"
                ? getSolarGeneration(config.powerDraw, nextDay, nextHour)
                : isNightPowerInterval
                  ? 0
                  : config.powerDraw;
            totalPowerGenerated += output;
          } else {
            totalPowerConsumed += Math.abs(config.powerDraw);
          }
          if (config.id === "battery") activeBatteryCount += 1;
        });

        if (!criticalSystemsBootstrapped && totalPowerGenerated > 0) {
          criticalSystemsBootstrapped = true;
          updatedModules = updatedModules.map((mod) =>
            isCriticalPowerModule(mod.id) && mod.hp > 0
              ? {
                  ...mod,
                  active: true,
                  powerPausedAt: undefined,
                  productionPausedAt: undefined,
                }
              : mod,
          );
          logs.push(
            "🔋 BOOTSTRAP: Habitat and life support came online after first solar power initialization.",
          );
        }

        const hasActiveBattery = updatedModules.some(
          (mod) => mod.id === "battery" && mod.hp > 0 && mod.active,
        );
        const batteryCanSupply =
          hasActiveBattery &&
          (isNightPowerInterval || isStormActiveThisHour);
        const availablePower =
          totalPowerGenerated + (batteryCanSupply ? powerBankCharge : 0);
        if (totalPowerConsumed > availablePower) {
          updatedModules = updatedModules.map((mod) => {
            const config = MODULES[mod.id];
            if (
              !config ||
              config.powerDraw >= 0 ||
              !mod.active ||
              mod.hp <= 0 ||
              isCriticalPowerModule(mod.id) ||
              totalPowerConsumed <= availablePower
            ) {
              return mod;
            }

            totalPowerConsumed -= Math.abs(config.powerDraw);
            return {
              ...mod,
              active: false,
              powerPausedAt: elapsedHour,
              productionPausedAt: elapsedHour,
            };
          });
        }

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
            (mod.powerSupplyEnabled ||
              nextHour === DAYLIGHT_START_HOUR ||
              isStormActiveThisHour),
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
        if (options?.processOxygen) {
          const hasCriticalSystems = updatedModules.some((mod) =>
            isCriticalPowerModule(mod.id),
          );
          const criticalSystemsOnline =
            hasCriticalSystems &&
            updatedModules.every(
              (mod) =>
                !isCriticalPowerModule(mod.id) ||
                (mod.hp > 0 && mod.active),
            );
          const criticalPowerAvailable =
            criticalSystemsOnline &&
            totalPowerGenerated + batteryDischarge >=
              CRITICAL_POWER_DEMAND;
          if (criticalPowerAvailable) {
            oxygenSpO2 = Math.min(
              100,
              oxygenSpO2 + OXYGEN_RECOVERY_PER_MINUTE * 60,
            );
          } else {
            oxygenSpO2 = Math.max(0, oxygenSpO2 - OXYGEN_DRAIN_PER_HOUR);
            if (oxygenSpO2 < OXYGEN_CRITICAL_THRESHOLD) {
              astronautHealth = Math.max(
                0,
                astronautHealth - OXYGEN_VITALS_LOSS_PER_HOUR,
              );
              if (astronautHealth <= 0) {
                oxygenFailureCause =
                  "The outpost lost critical life-support power. Oxygen levels fell too low and the astronaut's vitals failed.";
              }
            }
          }
        }
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

      const failedCriticalSystem = updatedModules.find(
        (module) =>
          isCriticalPowerModule(module.id) && module.hp <= 0,
      );
      const nextGameFailed =
        state.gameFailed ||
        failedCriticalSystem !== undefined ||
        astronautHealth <= 0;
      const nextFailureCause = failedCriticalSystem
        ? `${MODULES[failedCriticalSystem.id]?.name ?? failedCriticalSystem.id} was destroyed, leaving the outpost without a critical life-support system.`
        : oxygenFailureCause;

      return {
        currentHour: nextHour,
        currentDay: nextDay,
        lastRadiationWaveDay,
        criticalSystemsBootstrapped,
        placedModules: updatedModules,
        inventory: updatedInventory,
        powerBankCharge,
        workshopQueue,
        kitchenQueue,
        greenhouseQueue,
        sampleExtractorQueue,
        researchQueue,
        astronautHealth: Math.max(0, Math.min(100, astronautHealth + healthModifier)),
        oxygenSpO2,
        gameFailed: nextGameFailed,
        failureCause: nextFailureCause,
        gameLogs: logs,
      };
    });
    get().processUplinkConnection();
    if (get().gameFailed) get().stopPassiveTimer();
    if (get().currentDay > previousDay) {
      get().saveGameAtDayStart(get().currentDay);
    }
  },
}));

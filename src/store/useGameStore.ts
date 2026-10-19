import { create } from "zustand";
import type { ResourceType } from "../game/modules/module.types";
import { MODULES } from "../game/modules/moduleDefinitions";
import type { CraftingRecipe } from "../game/modules/data/recipesConfig";

const IDEAL_WAKE_HOUR = 7;
const IDEAL_SLEEP_HOUR = 21;
const FAINT_HOUR = 23;

const FOOD_FATIGUE_RECOVERY = {
  raw_food: 5,
  soup: 5,
  meal: 15,
  good_meal: 25,
} as const;

const FOOD_HEALTH_RECOVERY = {
  raw_food: 0,
  soup: 0,
  meal: 0,
  good_meal: 10,
} as const;
const FOOD_PRIORITY = ["good_meal", "meal", "soup", "raw_food"] as const;
const OVERTIME_FATIGUE_PER_HOUR = 10;
const NO_FOOD_HEALTH_LOSS = 10;

export interface CraftQueueItem {
  id: string;
  recipe: CraftingRecipe;
  queuedAt: number;
  startedAt: number;
  completesAt: number;
  completed: boolean;
}

const getGameHour = (day: number, hour: number, minute = 0) =>
  day * 24 + hour + minute / 60;

interface GameState {
  // --- STATE VARIABLES ---
  inventory: Record<ResourceType, number>;
  placedModules: Array<{
    id: string;
    instanceId: string;
    x: number;
    y: number;
    hp: number;
  }>;
  astronautHealth: number;
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  fatigueLevel: number;
  isFainted: boolean;
  nextWakeHour: number;
  overtimeHours: number;
  timerIntervalId: null | ReturnType<typeof setInterval>;
  workshopQueue: CraftQueueItem[];
  greenhouseQueue: CraftQueueItem[];

  activeRepairInstanceId: string | null; // Tracks which module is currently being wrenched
  startActiveRepairLoop: (instanceId: string) => void;
  stopActiveRepairLoop: () => void;

  // // NEW MECHANICS STATE
  radiationTowerQueues: Record<string, number>; // Maps tower instanceId -> count of active filters loaded
  isCommsEstablished: boolean; // Unlocks Sol 15 mission step
  gameLogs: string[]; // Narration strings push here for UI console

  // --- ACTIONS (MUTATORS) ---
  addResource: (resource: ResourceType, amount: number) => void;
  consumeResource: (resource: ResourceType, amount: number) => boolean;
  craftItem: (
    outputItem: ResourceType,
    recipe: Array<{ resource: ResourceType; amount: number }>,
  ) => boolean;
  queueCrafting: (recipe: CraftingRecipe) => boolean;
  cancelCrafting: (queueItemId: string) => boolean;
  processWorkshopQueue: () => void;
  queueGreenhouseCrafting: (recipe: CraftingRecipe) => boolean;
  cancelGreenhouseCrafting: (queueItemId: string) => boolean;
  processGreenhouseQueue: () => void;
  buildModule: (moduleId: string, gridX: number, gridY: number) => boolean;

  // // EXTENDED SYSTEM ACTIONS
  loadFilterToTower: (instanceId: string) => boolean;
  sleepUntilMorning: () => boolean;
  workOvertime: () => boolean;
  repairModule: (instanceId: string) => boolean;
  establishComms: () => boolean;
  advanceHour: (hours: number) => void;
  startPassiveTimer: () => void;
  stopPassiveTimer: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 1. Initial State Definitions
  inventory: {
    iron_ore: 20,
    silicates: 5,
    iron_plate: 25,
    glass_panel: 20,
    electronics: 10,
    repair_kit: 1,
    radiation_filter: 0,
    water_filter: 0,
    air_filter: 0,
    water: 10,
    raw_food: 5,
    soup: 1,
    meal: 2,
    good_meal: 0,
  },

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
    "radar",
  ],
  placedModules: [],
  astronautHealth: 100,
  currentDay: 1,
  currentHour: 7, // The ideal work day starts at 07:00
  currentMinute: 0,
  isFainted: false,
  nextWakeHour: IDEAL_WAKE_HOUR,
  overtimeHours: 0,

  timerIntervalId: null,
  workshopQueue: [],
  greenhouseQueue: [],
  activeRepairInstanceId: null,

  // // NEW MECHANICS STATE
  radiationTowerQueues: {},
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

  // 2. Add resources (Called when mining finishes or processing completes)
  addResource: (resource, amount) =>
    set((state) => ({
      inventory: {
        ...state.inventory,
        [resource]: (state.inventory[resource] || 0) + amount,
      },
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
        gameLogs: nextLogs,
        workshopQueue: state.workshopQueue.map((item) =>
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

  // 6. Radiation Tower Filter Queue Logic
  loadFilterToTower: (instanceId) => {
    const { inventory, consumeResource } = get();
    if ((inventory["radiation_filter"] || 0) < 1) return false;

    consumeResource("radiation_filter", 1);
    set((state) => ({
      radiationTowerQueues: {
        ...state.radiationTowerQueues,
        [instanceId]: (state.radiationTowerQueues[instanceId] || 0) + 1,
      },
    }));
    return true;
  },

  // 7. Core Work Shifts Loop
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
    const overtimeHours = currentHour - IDEAL_SLEEP_HOUR;
    get().advanceHour(10);

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

  // --- APPEND THESE TWO NEW METHODS AT THE VERY BOTTOM OF THE STORE OBJECT ---
  startPassiveTimer: () => {
    if ((get() as any).timerIntervalId) return;

    // 💥 Ticks every 100ms. 60 game minutes will pass over 6 real-world seconds
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
        store.processGreenhouseQueue();
      } else {
        // Just increment the active clock minutes
        set({ currentMinute: nextMinute });
        store.processWorkshopQueue();
        store.processGreenhouseQueue();
      }
    }, 1000); // 100ms = ultra-fast fluid clock simulation update rate

    set({ timerIntervalId: interval });
  },

  stopPassiveTimer: () => {
    const id = (get() as any).timerIntervalId;
    if (id) {
      clearInterval(id);
      set({ timerIntervalId: null, currentMinute: 0 }); // Clean minute offsets on pause
    }
  },

  startActiveRepairLoop: (instanceId: string) => {
    const { stopPassiveTimer, timerIntervalId } = get() as any;

    // 1. Guard check: Avoid duplicating intervals if already actively repairing
    if (timerIntervalId && get().activeRepairInstanceId === instanceId) return;

    // 2. Clear out the passive slow ticking interval loop instantly
    stopPassiveTimer();

    // 3. Mark this module instance as the active repair target
    set({ activeRepairInstanceId: instanceId });

    console.log(`🔧 High-speed repair initialized for instance: ${instanceId}`);

    // 4. 🚀 FAST-FORWARD INTERVAL: Ticks every 50ms (Ultra-fast time progression!)
    // Every 50ms advances the game clock by 10 minutes and restores structural HP
    const repairInterval = setInterval(() => {
      const store = get() as any;
      const targetInstance = store.placedModules.find(
        (m: any) => m.instanceId === instanceId,
      );

      if (!targetInstance) {
        store.stopActiveRepairLoop();
        return;
      }

      const config = MODULES[targetInstance.id];
      const maxHp = config ? config.maxIntegrity : 100;

      // Check if player ran out of repair materials during the fast-forward ticks
      if ((store.inventory.repair_kit || 0) <= 0 && targetInstance.hp < maxHp) {
        set((state) => ({
          gameLogs: [
            ...state.gameLogs,
            "🚨 REPAIR HALTED: Out of functional Multi-Tool Maintenance Kits!",
          ],
        }));
        store.stopActiveRepairLoop();
        return;
      }

      // If fully restored, automatically terminate the high-speed loop
      if (targetInstance.hp >= maxHp) {
        set((state) => ({
          gameLogs: [
            ...state.gameLogs,
            `✅ SUCCESS: ${config?.name || "Module"} fully restored to nominal specs.`,
          ],
        }));
        store.stopActiveRepairLoop();
        return;
      }

      // Transformation logic per 50ms tick: Consume material fragments and heal structural cells
      let nextMinute = store.currentMinute + 10; // Fast forward 10 game minutes per tick
      // Every 30 game minutes of work, consume 1 material kit repair item count
      if (nextMinute % 30 === 0) {
        store.consumeResource("repair_kit", 1);
      }

      // Step up structural HP health pools
      const updatedModules = store.placedModules.map((m: any) => {
        if (m.instanceId === instanceId) {
          // Incrementally restore health points dynamically
          return { ...m, hp: Math.min(maxHp, m.hp + 5) };
        }
        return m;
      });

      if (nextMinute >= 60) {
        // A full game hour passed in fast-forward! Run base auto extractions/power audits
        store.advanceHour(1);
        set({ currentMinute: 0, placedModules: updatedModules });
      } else {
        set({ currentMinute: nextMinute, placedModules: updatedModules });
      }
    }, 50);

    set({ timerIntervalId: repairInterval });
  },

  stopActiveRepairLoop: () => {
    const id = (get() as any).timerIntervalId;
    if (id) {
      clearInterval(id);
      // Null out active interval and target parameters, then boot passive clock back up
      set({ timerIntervalId: null, activeRepairInstanceId: null });
      console.log(
        "⏱️ High-speed repair halted. Resuming normal time passage parameters.",
      );
      (get() as any).startPassiveTimer();
    }
  },

  // 9. Narrative Progression Interaction
  establishComms: () => {
    const { currentDay, placedModules } = get();
    const hasRadar = placedModules.some((m) => m.id === "radar" && m.hp > 0);

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
  advanceHour: (hours) =>
    set((state) => {
      let nextHour = state.currentHour;
      let nextDay = state.currentDay;
      let updatedModules = [...state.placedModules];
      let updatedInventory = { ...state.inventory };
      let logs = [...state.gameLogs];
      let newTowerQueues = { ...state.radiationTowerQueues };
      let workshopQueue = [...state.workshopQueue];
      let healthModifier = 0;

      // Active environmental modifiers based on timeline narrative context rules
      const isStormActive = nextDay >= 10 && nextDay <= 18;
      const isExtremeRadiationActive = nextDay === 29;

      // Loop hourly to process state changes sequentially
      for (let i = 0; i < hours; i++) {
        nextHour += 1;

        // Handle Day/Night transition thresholds at Midnight
        if (nextHour >= 24) {
          nextHour = 0;
          nextDay += 1;

          // Midnight Structural Decay Tick Loop
          updatedModules = updatedModules.map((mod) => {
            const config = MODULES[mod.id];
            let decay = config ? config.baseDecayRate : 2;

            // Environmental Amplifiers: Storm strains greenhouses and filters heavily
            if (isStormActive && config?.category === "life_support")
              decay *= 2;
            if (isExtremeRadiationActive && mod.id === "radiation_tower")
              decay *= 3;

            return { ...mod, hp: Math.max(0, mod.hp - decay) };
          });
        }

        const elapsedHour = getGameHour(nextDay, nextHour);
        const completedItems = workshopQueue.filter(
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
        let activeRadTowersCount = 0;

        updatedModules.forEach((mod) => {
          if (mod.hp <= 0) return; // Broken modules draw/generate no grid power
          const config = MODULES[mod.id];
          if (!config) return;

          if (config.powerDraw > 0) {
            // Solar efficiency drops by 90% during Sol 10-18 dust storm events
            const output =
              isStormActive && config.id === "solar"
                ? Math.floor(config.powerDraw * 0.1)
                : config.powerDraw;
            totalPowerGenerated += output;
          } else {
            totalPowerConsumed += Math.abs(config.powerDraw);
          }
        });

        const hasPowerSurplus = totalPowerGenerated >= totalPowerConsumed;

        // --- PHASE 2: RESOURCE TRANSFORMATION & CONSUMPTION COMPUTATIONS ---
        updatedModules.forEach((mod) => {
          if (mod.hp <= 0) return;
          const config = MODULES[mod.id];
          if (!config) return;

          // A. Process Rad Shields (Aegis Towers require power + loaded filters)
          if (config.id === "radiation_tower" && hasPowerSurplus) {
            const currentQueue = newTowerQueues[mod.instanceId] || 0;
            if (currentQueue > 0) {
              activeRadTowersCount += 1;
              // Tower burns 1 queued filter every 4 operational hours
              if (nextHour % 4 === 0) {
                newTowerQueues[mod.instanceId] = currentQueue - 1;
              }
            }
          }

          // B. Process Module Operational Transformations (Inputs -> Outputs)
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

            // Step 3: Run output generations if grid has power and dependencies were met
            if (inputsSatisfied && config.productionOutputs) {
              config.productionOutputs.forEach((out) => {
                updatedInventory[out.resource] =
                  (updatedInventory[out.resource] || 0) + out.amountPerTick;
              });
            }
          }
        });

        // --- PHASE 3: ASTRONAUT ENVIRONMENTAL EXPOSURE DAMAGE MATRIX ---
        if (isExtremeRadiationActive) {
          // If no radiation shield towers are actively burning filters during Sol 29, health decays rapidly
          if (activeRadTowersCount === 0) {
            healthModifier -= 4; // Astronaut loses 4 HP every unshielded hour
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

      return {
        currentHour: nextHour,
        currentDay: nextDay,
        placedModules: updatedModules,
        inventory: updatedInventory,
        radiationTowerQueues: newTowerQueues,
        workshopQueue,
        astronautHealth: Math.max(
          0,
          Math.min(100, state.astronautHealth + healthModifier),
        ),
        gameLogs: logs,
      };
    }),
}));

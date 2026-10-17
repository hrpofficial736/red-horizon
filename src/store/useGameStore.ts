import { create } from "zustand";
import type { ResourceType } from "../game/modules/module.types";
import { MODULES } from "../game/modules/moduleDefinitions";

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

  // // NEW MECHANICS STATE
  radiationTowerQueues: Record<string, number>; // Maps tower instanceId -> count of active filters loaded
  fatigueLevel: number; // 0 to 100 scale representing exhaustion
  isCommsEstablished: boolean; // Unlocks Sol 15 mission step
  gameLogs: string[]; // Narration strings push here for UI console

  // --- ACTIONS (MUTATORS) ---
  addResource: (resource: ResourceType, amount: number) => void;
  consumeResource: (resource: ResourceType, amount: number) => boolean;
  craftItem: (
    outputItem: ResourceType,
    recipe: Array<{ resource: ResourceType; amount: number }>,
  ) => boolean;
  buildModule: (moduleId: string, gridX: number, gridY: number) => boolean;

  // // EXTENDED SYSTEM ACTIONS
  loadFilterToTower: (instanceId: string) => boolean;
  executeShift: (shiftLength: 8 | 12) => void;
  repairModule: (instanceId: string) => boolean;
  establishComms: () => boolean;
  advanceHour: (hours: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 1. Initial State Definitions
  inventory: {
    iron_ore: 10,
    silicates: 5,
    iron_plate: 25,
    glass_panel: 10,
    electronics: 10,
    repair_kit: 1,
    water: 10,
    food: 5,
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
  currentHour: 8, // Shift starts at 08:00

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
    // Assuming repair_kit is reused or substituted as radiation filter item unit mapping
    if ((inventory["repair_kit"] || 0) < 1) return false;

    consumeResource("repair_kit", 1);
    set((state) => ({
      radiationTowerQueues: {
        ...state.radiationTowerQueues,
        [instanceId]: (state.radiationTowerQueues[instanceId] || 0) + 1,
      },
    }));
    return true;
  },

  // 7. Core Work Shifts Loop
  executeShift: (shiftLength) => {
    const { advanceHour, consumeResource } = get();

    // Shift calculations modifier: Extended shifts consume double survival rations
    const consumptionMultiplier = shiftLength === 12 ? 2 : 1;
    const waterDeducted = consumeResource("water", 1 * consumptionMultiplier);
    const foodDeducted = consumeResource("food", 1 * consumptionMultiplier);

    if (!waterDeducted || !foodDeducted) {
      set((state) => ({
        astronautHealth: Math.max(0, state.astronautHealth - 25),
        gameLogs: [
          ...state.gameLogs,
          `🚨 CRITICAL: Starvation/Dehydration active! Astronaut took severe physical health hit.`,
        ],
      }));
    }

    set((state) => ({
      fatigueLevel:
        shiftLength === 12
          ? Math.min(100, state.fatigueLevel + 40)
          : Math.min(100, state.fatigueLevel + 10),
    }));

    // Trigger hourly system changes across the duration parameter
    advanceHour(shiftLength);

    // Sleep block follows work window: instantly returns fatigue tracking back to zero parameters
    set((state) => ({
      fatigueLevel: 0,
      currentHour: 8, // reset clock back to normal morning shift hour configuration
    }));
    // Note: advancing to morning pushes day count automatically via advanceHour if cross midnight threshold
  },

  // 8. Module Maintenance Action Function
  repairModule: (instanceId) => {
    const { inventory, consumeResource, placedModules } = get();
    if ((inventory["repair_kit"] || 0) < 1) return false;

    const moduleObj = placedModules.find((m) => m.instanceId === instanceId);
    if (!moduleObj) return false;
    const config = MODULES[moduleObj.id];
    if (!config) return false;

    consumeResource("repair_kit", 1);
    set((state) => ({
      placedModules: state.placedModules.map((m) =>
        m.instanceId === instanceId ? { ...m, hp: config.maxIntegrity } : m,
      ),
    }));
    return true;
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
        astronautHealth: Math.max(
          0,
          Math.min(100, state.astronautHealth + healthModifier),
        ),
        gameLogs: logs,
      };
    }),
}));

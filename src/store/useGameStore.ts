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

  // --- ACTIONS (MUTATORS) ---
  addResource: (resource: ResourceType, amount: number) => void;
  consumeResource: (resource: ResourceType, amount: number) => boolean;
  craftItem: (
    outputItem: ResourceType,
    recipe: Array<{ resource: ResourceType; amount: number }>,
  ) => boolean;
  buildModule: (moduleId: string, gridX: number, gridY: number) => boolean;
  advanceHour: (hours: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 1. Initial State Definitions
  inventory: {
    iron_ore: 10,
    silicates: 5,
    iron_plate: 4,
    glass_panel: 2,
    electronics: 0,
    repair_kit: 1,
    water: 10,
    food: 5,
  },
  placedModules: [],
  astronautHealth: 100,
  currentDay: 1,
  currentHour: 8, // Shift starts at 08:00

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

  // 6. Shift Time Progression Handling
  advanceHour: (hours) =>
    set((state) => {
      let nextHour = state.currentHour + hours;
      let nextDay = state.currentDay;

      if (nextHour >= 24) {
        nextHour = nextHour - 24;
        nextDay += 1;

        // TRIGGER SYSTEM DECAY EVENT: Deduct health from structures at midnight
        // (You can append code here to trigger random sandstorm damage ticks)
      }

      return { currentHour: nextHour, currentDay: nextDay };
    }),
}));

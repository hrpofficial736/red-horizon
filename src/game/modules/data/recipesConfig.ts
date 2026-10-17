import type { ResourceType } from "../module.types";

export interface CraftingRecipe {
  output: ResourceType;
  name: string;
  description: string;
  cost: Array<{ resource: ResourceType; amount: number }>;
}

export const WORKSHOP_RECIPES: CraftingRecipe[] = [
  {
    output: "repair_kit",
    name: "🔧 Multi-Tool Repair Kit",
    description:
      "Used by the astronaut to patch structural hull integrity and fix degraded modules.",
    cost: [
      { resource: "iron_plate", amount: 1 },
      { resource: "electronics", amount: 1 },
    ],
  },
  {
    output: "electronics",
    name: "🧪 High-Freq Micro-Electronics",
    description:
      "Fused silicates and iron wiring required for computer arrays and radars.",
    cost: [
      { resource: "iron_ore", amount: 1 },
      { resource: "silicates", amount: 2 },
    ],
  },
  {
    output: "iron_plate",
    name: "⚙️ Reinforced Iron Plate",
    description:
      "Refined structural iron used as the baseline framing for all base modules.",
    cost: [{ resource: "iron_ore", amount: 3 }],
  },
  {
    output: "glass_panel",
    name: "🪟 Silicate Solar Glass",
    description:
      "Heavy treated glass used to build Greenhouses and Solar Array surfaces.",
    cost: [{ resource: "silicates", amount: 3 }],
  },
];

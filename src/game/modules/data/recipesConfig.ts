import type { ResourceType } from "../module.types";

export interface CraftingRecipe {
  output: ResourceType;
  name: string;
  description: string;
  craftHours: number;
  outputAmount?: number;
  cost: Array<{ resource: ResourceType; amount: number }>;
}

export const SAMPLE_EXTRACTOR_RECIPES: CraftingRecipe[] = [
  {
    output: "mars_sample",
    name: "Mars Sample",
    description:
      "A sterile geological sample extracted from the Martian surface for analysis and research.",
    craftHours: 2,
    cost: [{ resource: "silicates", amount: 2 }],
  },
];

export const WORKSHOP_RECIPES: CraftingRecipe[] = [
  {
    output: "repair_kit",
    name: "Repair Kit",
    description:
      "Used by the astronaut to patch structural hull integrity and fix degraded modules.",
    craftHours: 2,
    cost: [
      { resource: "iron_plate", amount: 1 },
      { resource: "electronics", amount: 1 },
    ],
  },
  {
    output: "electronics",
    name: "Electronics",
    description:
      "Fused silicates and iron wiring required for computer arrays and radars.",
    craftHours: 2,
    cost: [
      { resource: "iron_ore", amount: 2 },
      { resource: "silicates", amount: 3 },
    ],
  },
  {
    output: "iron_plate",
    name: "Iron Plate",
    description:
      "Refined structural iron used as the baseline framing for all base modules.",
    craftHours: 1,
    cost: [{ resource: "iron_ore", amount: 4 }],
  },
  {
    output: "glass_panel",
    name: "Glass Panel",
    description:
      "Heavy treated glass used to build Greenhouses and Solar Array surfaces.",
    craftHours: 1,
    cost: [{ resource: "silicates", amount: 4 }],
  },
];

export const KITCHEN_RECIPES: CraftingRecipe[] = [
  {
    output: "soup",
    name: "Soup",
    description:
      "A warm, nutritious soup prepared from raw food to restore the astronaut's energy during a long shift.",
    craftHours: 1,
    cost: [{ resource: "raw_food", amount: 2 }],
  },
  {
    output: "meal",
    name: "Meal",
    description:
      "A balanced meal assembled from fresh ingredients to provide reliable nourishment on Mars.",
    craftHours: 2,
    cost: [{ resource: "raw_food", amount: 3 }],
  },
  {
    output: "heavy_meal",
    name: "Heavy Meal",
    description:
      "A carefully prepared gourmet meal that delivers the best nutrition and helps the astronaut recover from fatigue.",
    craftHours: 3,
    cost: [{ resource: "raw_food", amount: 5 }],
  },
];

export const RESOURCES: CraftingRecipe[] = [
  {
    output: "iron_ore",
    name: "Iron Ore",
    description:
      "Raw iron-bearing ore extracted from the Martian soil for refining and construction.",
    craftHours: 1,
    cost: [],
  },
  {
    output: "silicates",
    name: "Silicates",
    description:
      "Raw silicate minerals collected from the Martian surface for glass and electronics production.",
    craftHours: 1,
    cost: [],
  },
  {
    output: "water",
    name: "Water",
    description:
      "Purified water collected for the colony's life-support, food, and hydration systems.",
    craftHours: 1,
    cost: [],
  },
];

export const FOOD_PACK_RECIPES: CraftingRecipe[] = [
  {
    output: "raw_food",
    name: "Raw Food",
    description:
      "A compact greenhouse harvest pack containing two portions of raw food.",
    craftHours: 1,
    outputAmount: 2,
    cost: [{ resource: "water", amount: 1 }],
  },
  {
    output: "raw_food",
    name: "Raw Food",
    description:
      "A full greenhouse harvest pack containing ten portions of raw food.",
    craftHours: 3,
    outputAmount: 10,
    cost: [{ resource: "water", amount: 5 }],
  },
];

export const INVENTORY_RECIPES: CraftingRecipe[] = [
  ...WORKSHOP_RECIPES,
  ...KITCHEN_RECIPES,
  ...RESOURCES,
  ...FOOD_PACK_RECIPES,
  ...SAMPLE_EXTRACTOR_RECIPES,
];

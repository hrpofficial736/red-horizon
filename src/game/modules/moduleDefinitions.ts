import type { ModuleDef } from "./module.types";

export const MODULES: Record<string, ModuleDef> = {
  // --- 1. LIFE SUPPORT & HABITAT ---
  habitat: {
    id: "habitat",
    name: "Crew Habitat",
    description:
      "The primary survival pod. Keeps the astronaut alive, processes meals, and saves progress.",
    category: "life_support",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "habitat",
    height: 62,
    color: 0xcccccc,
    anchor: "center",
    originY: 0.64,
    scale: 0.2,
    buildCost: [
      { resource: "iron_plate", amount: 8 },
      { resource: "glass_panel", amount: 4 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 4,
    powerDraw: -5, // Passive background drain
    productionInputs: [{ resource: "water", amountPerTick: 1 }],
    maxModules: 1, // Only one habitat can be built at a time
    moduleCapacity: 200,
  },
  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse",
    description:
      "Cultivates Martian crops using water and intensive artificial light configurations.",
    category: "life_support",
    isUnlockedByDefault: true,
    w: 3,
    h: 5,
    texture: "greenhouse",
    height: 62,
    color: 0x98fb98,
    anchor: "center",
    originY: 0.57,
    scale: 0.42,
    buildCost: [
      { resource: "iron_plate", amount: 4 },
      { resource: "glass_panel", amount: 8 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 5, // High wind vulnerability
    powerDraw: -12,
    maxModules: 1, // Only one greenhouse can be built at a time
  },
  kitchen: {
    id: "kitchen",
    name: "Kitchen",
    description:
      "Prepares harvested ingredients into nutritious meals for the astronaut.",
    category: "life_support",
    isUnlockedByDefault: true,
    w: 2,
    h: 3,
    texture: "kitchen",
    height: 62,
    color: 0xffd7a0,
    anchor: "center",
    originY: 0.64,
    scale: 0.21,
    buildCost: [
      { resource: "iron_plate", amount: 6 },
      { resource: "glass_panel", amount: 2 },
      { resource: "electronics", amount: 2 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 3,
    powerDraw: -8,
    maxModules: 1,
  },
  radiation_tower: {
    id: "radiation_tower",
    name: "Rad-Shield Tower",
    description:
      "Generates a localized magnetic bubble that reduces continuous and wave radiation damage in the surrounding area.",
    category: "power", // Categorized under grid infrastructure
    isUnlockedByDefault: false, // Must be unlocked via Laboratory blueprints!
    w: 2,
    h: 2,
    texture: "radiation_tower",
    height: 95, // Tall asset structure on the grid map
    color: 0x7b68ee,
    anchor: "center",
    originY: 0.8,
    scale: 0.32,
    buildCost: [
      { resource: "iron_plate", amount: 14 },
      { resource: "electronics", amount: 8 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 8, // Heavily worn down by solar particle bombardments
    powerDraw: -25, // Demands heavy baseline electrical routing to run the magnets
    maxModules: 1, // Only one radiation tower can be built at a time
  },

  // --- CORE LIFE SUPPORT MODULE ---
  life_support: {
    id: "life_support",
    name: "Life Support",
    description:
      "Primary environmental system. Regulates internal air pressure, scrubs carbon dioxide, and pumps vital water reserves back through the base.",
    category: "life_support",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "life_support",
    height: 60,
    color: 0x00ff7f,
    anchor: "center",
    originY: 0.67,
    scale: 0.22,
    buildCost: [
      { resource: "iron_plate", amount: 8 },
      { resource: "glass_panel", amount: 4 },
      { resource: "electronics", amount: 6 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 4,
    powerDraw: -12, // Critical core draw
    productionInputs: [
      { resource: "water", amountPerTick: 1 }, // Recycles water into structural oxygen loops
    ],
    maxModules: 1, // Only one life support node can be built at a time
  },

  // --- 2. RESOURCE GATHERING & PROCESSING ---
  water: {
    id: "water",
    name: "Water Extractor",
    description:
      "Melts and purifies deep subsurface regolith ice reserves into drinking water.",
    category: "production",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "water",
    height: 62,
    color: 0xcccccc,
    anchor: "center",
    originY: 0.68,
    scale: 0.24,
    buildCost: [
      { resource: "iron_plate", amount: 5 },
      { resource: "electronics", amount: 2 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 4,
    powerDraw: -10,
    productionOutputs: [{ resource: "water", amountPerTick: 2 }],
    maxModules: 4, // Only one water extractor can be built at a time
  },
  drill: {
    id: "drill",
    name: "Regolith Extractor",
    description:
      "Heavy mechanical drill that extracts raw iron ore and high-density silicates.",
    category: "production",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "drill",
    height: 70,
    color: 0x8b4513,
    anchor: "center",
    originY: 0.7,
    scale: 0.232,
    buildCost: [
      { resource: "iron_plate", amount: 6 },
      { resource: "electronics", amount: 3 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 6, // High mechanical wear from abrasive dust
    powerDraw: -18,
    productionOutputs: [
      { resource: "iron_ore", amountPerTick: 3 },
      { resource: "silicates", amountPerTick: 2 },
    ],
    maxModules: 2, // Only two drills can be built at a time
  },
  workshop: {
    id: "workshop",
    name: "Workshop",
    description:
      "Refines raw elements into structural plates, glass panels, components, and tools.",
    category: "production",
    isUnlockedByDefault: true,
    w: 2,
    h: 2, // Larger spatial footprint on the grid
    texture: "workshop",
    height: 90,
    color: 0xffa500,
    anchor: "center",
    originY: 0.65,
    scale: 0.24,
    buildCost: [
      { resource: "iron_plate", amount: 10 },
      { resource: "electronics", amount: 5 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 3,
    powerDraw: -8, // Low background power, high when actively crafting items
    maxModules: 1, // Only one workshop can be built at a time
  },

  // --- 3. POWER GENERATION & STORAGE ---
  solar: {
    id: "solar",
    name: "Solar Array",
    description:
      "Generates renewable energy. Highly vulnerable to drop-offs during dust storm events.",
    category: "power",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "solar",
    height: 32,
    color: 0x0000ff,
    anchor: "center",
    originY: 0.7,
    scale: 0.24,
    buildCost: [
      { resource: "iron_plate", amount: 2 },
      { resource: "glass_panel", amount: 4 },
      { resource: "electronics", amount: 2 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 4,
    powerDraw: 25, // Positive value: generates 25 units of energy during standard daylight
    maxModules: 4, // Only four solar arrays can be built at a time
  },
  battery: {
    id: "battery",
    name: "Power Station Bank",
    description:
      "Stores power surpluses during peak generation cycles to keep life support operational overnight.",
    category: "power",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "battery",
    height: 50,
    color: 0x00ff00,
    anchor: "center",
    originY: 0.66,
    scale: 0.23,
    buildCost: [
      { resource: "iron_plate", amount: 6 },
      { resource: "electronics", amount: 6 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 2,
    powerDraw: 0, // Handles storage capacity changes through game context logic
    maxModules: 2, // Only two battery banks can be built at a time
    powerCapacity: 200,
  },

  // --- 4. TECHNOLOGY & TECH LOGS ---
  researchLab: {
    id: "researchLab",
    name: "Research Lab",
    description:
      "Processes data logs to unlock advanced base defenses and radiation filters.",
    category: "tech",
    isUnlockedByDefault: true,
    w: 2,
    h: 2,
    texture: "researchLab",
    height: 80,
    color: 0x00ffff,
    anchor: "center",
    originY: 0.7,
    scale: 0.24,
    buildCost: [
      { resource: "iron_plate", amount: 6 },
      { resource: "glass_panel", amount: 6 },
      { resource: "electronics", amount: 8 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 3,
    powerDraw: -20,
    maxModules: 1, // Only one research lab can be built at a time
  },
  radar: {
    id: "radar",
    name: "Comms Radar",
    description:
      "Establishes structural signals back to Earth and scans adjacent Martian sectors for rescue assets.",
    category: "tech",
    isUnlockedByDefault: false, // Must be unlocked via Laboratory research!
    w: 2,
    h: 2,
    texture: "radar",
    height: 75,
    color: 0xff00ff,
    anchor: "center",
    originY: 0.76,
    scale: 0.29,
    buildCost: [
      { resource: "iron_plate", amount: 4 },
      { resource: "electronics", amount: 8 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 5,
    powerDraw: -15,
    maxModules: 2, // Only one radar can be built at a time
  },
  storage_small: {
    id: "storage_small",
    name: "Supply Depot (S)",
    description:
      "A compact secure locker. Increases your maximum resource inventory limits.",
    category: "storage",
    isUnlockedByDefault: true,
    w: 2,
    h: 2, // Compact footprint on the isometric grid
    texture: "storage_small",
    height: 40,
    color: 0xdeb887,
    anchor: "center",
    originY: 0.68,
    scale: 0.24,
    buildCost: [{ resource: "iron_plate", amount: 4 }],
    maxIntegrity: 100,
    baseDecayRate: 2, // Low maintenance required
    powerDraw: 0, // Passively adds inventory capacity without consuming power
    maxModules: 4, // Only four supply depots can be built at a time
    moduleCapacity: 50, // Each small storage module can hold 50 units of resources
  },
  storage_large: {
    id: "storage_large",
    name: "Supply Depot (L)",
    description:
      "Advanced heavy vault equipped with climate-controlled tracking for vast stockpiles.",
    category: "storage",
    isUnlockedByDefault: false, // Must be researched in the Laboratory first!
    w: 2,
    h: 2,
    texture: "storage_large",
    height: 75,
    color: 0xcd853f,
    anchor: "center",
    originY: 0.65,
    scale: 0.19,
    // scale: 0.25,
    buildCost: [
      { resource: "iron_plate", amount: 12 },
      { resource: "electronics", amount: 4 },
    ],
    maxIntegrity: 100, // Highly durable against winds
    baseDecayRate: 3,
    powerDraw: -2, // Uses minimal power to run its internal automated conveyor systems
    maxModules: 2, // Only two large storage hubs can be built at a time
    moduleCapacity: 200, // Each large storage module can hold 200 units of resources
  },

  // --- COMMUNICATION MODULE ---
  communication: {
    id: "communication",
    name: "Mission Control Uplink",
    description:
      "Houses deep-space transmitter nodes. Essential for checking in with Earth and coordinating your Sol 30 rescue itinerary.",
    category: "tech",
    isUnlockedByDefault: false, // Must be unlocked via Laboratory research!
    w: 2,
    h: 2,
    texture: "communication",
    height: 68,
    color: 0x4682b4,
    anchor: "center",
    originY: 0.75,
    scale: 0.27,
    buildCost: [
      { resource: "iron_plate", amount: 6 },
      { resource: "glass_panel", amount: 2 },
      { resource: "electronics", amount: 8 },
    ],
    maxIntegrity: 100,
    baseDecayRate: 4,
    powerDraw: -15, // Demands heavy baseline electrical infrastructure to punch through Martian storms
    maxModules: 1, // Only one communication module can be built at a time
  },
};

// export const MODULES: Record<string, ModuleDef> = {
//   block: {
//     id: "block",
//     w: 1,
//     h: 1,
//     texture: "block",
//     height: 32 * SCALE,
//     color: 0x6bbf4e,
//     scale: 0.125,
//   },
//   habitat: {
//     id: "habitat",
//     w: 3,
//     h: 3,
//     texture: "habitat",
//     height: 62 * SCALE,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.64,
//     // scale: 0.05,
//     scale: 0.08,
//   },
//   solarPanel: {
//     id: "solarPanel",
//     w: 3,
//     h: 3,
//     texture: "solarPanel",
//     height: 62 * SCALE,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.7,
//     // scale: 0.11,
//     scale: 0.16,
//   },
//   communication: {
//     id: "communication",
//     w: 2,
//     h: 2,
//     texture: "communication",
//     height: 62 * SCALE,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.76,
//     scale: 0.14,
//   },
//   storage: {
//     id: "storage",
//     w: 2,
//     h: 2,
//     texture: "storage",
//     height: 62 * SCALE,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.68,
//     scale: 0.12,
//     // scale: 0.178,
//   },
//   radar: {
//     id: "radar",
//     w: 3,
//     h: 3,
//     texture: "radar",
//     height: 62 * SCALE,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.76,
//     // scale: 0.14,
//     scale: 0.2,
//   },
//   water: {
//     id: "water",
//     w: 2,
//     h: 2,
//     texture: "water",
//     height: 62,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.68,
//     scale: 0.1,
//   },
//   GreenHouse: {
//     id: "greenHouse",
//     w: 3,
//     h: 6,
//     texture: "greenHouse",
//     height: 62,
//     color: 0xcccccc,
//     anchor: "center",
//     originY: 0.57,
//     scale: 0.24,
//   },
//   panel: {
//     id: "panel",
//     w: 2,
//     h: 2,
//     texture: "panel",
//     height: 24 * SCALE,
//     color: 0x4a6fa5,
//   },
//   windmill: {
//     id: "windmill",
//     w: 1,
//     h: 1,
//     texture: "windmill",
//     height: 130 * SCALE,
//     color: 0xdddddd,
//     anim: "windmill-spin",
//     frames: WINDMILL_FRAMES,
//     anchor: "center",
//     originY: WINDMILL_ORIGIN_Y,
//     scale: WINDMILL_SCALE,
//   },
// };

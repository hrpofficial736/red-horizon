// export interface ModuleDef {
//   id: string;
//   w: number;
//   h: number;
//   texture: string;
//   height: number;
//   color: number;
//   anim?: string; // animation key to play on the placed sprite
//   frames?: number; // number of frames (used for a random start frame)
//   anchor?: "bottom" | "center"; // bottom = footprint's bottom corner, center = ground centre of footprint
//   originY?: number; // sprite origin Y when anchor = "center"
//   scale?: number; // overrides SCALE for this module
// }

// 1. Define the core resource types available in your game loop
export type ResourceType =
  | "iron_ore"
  | "silicates" // Raw materials
  | "iron_plate"
  | "glass_panel" // Refined materials
  | "electronics"
  | "repair_kit" // Advanced items/Tools
  | "water_filter"
  | "air_filter"
  | "water"
  | "raw_food" // Survival elements
  | "soup"
  | "meal"
  | "good_meal";

// 2. Define the functional category of a module for game logic execution
export type ModuleCategory =
  | "life_support"
  | "production"
  | "power"
  | "storage"
  | "tech";

// 3. Define the blueprint cost interface
export interface ResourceCost {
  resource: ResourceType;
  amount: number;
}

// 4. Define the active rates (inputs/outputs per tick or shift hour)
export interface ResourceRate {
  resource: ResourceType;
  amountPerTick: number;
}

export interface ModuleDef {
  // --- YOUR ORIGINAL PHASER CONFIGS ---
  id: string;
  w: number; // Width in grid cells
  h: number; // Height in grid cells
  texture: string;
  height: number;
  color: number;
  anim?: string;
  frames?: number;
  anchor?: "bottom" | "center";
  originY?: number;
  scale?: number;

  // --- NEW GAME MECHANICS & CRAFTING CONFIGS ---
  name: string; // User-friendly display name
  description: string; // UI tooltips description
  category: ModuleCategory; // Grouping for the React build menu
  isUnlockedByDefault: boolean; // Control research locks (e.g., false for Rad Filter)

  // Costs to construct this module in the Workshop
  buildCost: ResourceCost[];

  // Gameplay parameters
  maxIntegrity: number; // Max HP of the module (e.g., 100)
  baseDecayRate: number; // Legacy environmental wear value retained for module data compatibility

  // Power consumption or generation per operational hour
  // Positive = Generates power (Solar Panel), Negative = Consumes power (Drill)
  powerDraw: number;
  powerCapacity?: number; // Stored energy capacity for battery modules

  // Direct resource inputs and outputs when active during a shift.
  // Extraction modules use productionOutputs for each resource they extract.
  productionInputs?: ResourceRate[];
  productionOutputs?: ResourceRate[];
  maxModules?: number; // Optional: Limit on how many of this module can be built at once
  moduleCapacity?: number; // Optional: For storage modules, defines how much resource it can hold
}

export type Pt = { x: number; y: number };
export type Footprint = { top: Pt; right: Pt; bottom: Pt; left: Pt };
export interface Placed {
  // instanceId: string;
  uid: number;
  def: ModuleDef;
  col: number;
  row: number;
  view: Phaser.GameObjects.GameObject;
  label?: Phaser.GameObjects.Text;
  ring?: Phaser.GameObjects.Graphics;
}

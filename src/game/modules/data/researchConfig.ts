import type { ResourceType } from "../module.types";

export type ResearchCategory = "FOOD" | "TECH" | "BASE";

export interface ResearchNode {
  id: string;
  category: ResearchCategory;
  name: string;
  description: string;
  silicateCost: number;
  researchHours: number;
  requires?: string[];
  texture?: string;
  unlocks?: {
    resource?: ResourceType;
    moduleId?: string;
    efficiencyKey?: string;
  };
}

export const RESEARCH_TREE: ResearchNode[] = [
  {
    id: "food_meal",
    category: "FOOD",
    name: "Meal Preparation",
    description: "Unlocks the balanced meal recipe in the kitchen.",
    silicateCost: 3,
    researchHours: 4,
    texture: "meal",
    unlocks: { resource: "meal" },
  },
  {
    id: "food_heavy_meal",
    category: "FOOD",
    name: "Nutritional Optimization",
    description: "Unlocks the high-nutrition good meal recipe.",
    silicateCost: 6,
    researchHours: 6,
    requires: ["food_meal"],
    texture: "good_meal",
    unlocks: { resource: "heavy_meal" },
  },
  {
    id: "base_radiation_tower",
    category: "BASE",
    name: "Rad-Shield Tower",
    description: "Unlocks construction of the radiation protection tower.",
    silicateCost: 15,
    researchHours: 6,
    texture: "radiation_tower",
    unlocks: { moduleId: "radiation_tower" },
  },
  {
    id: "base_large_storage",
    category: "BASE",
    name: "Large Storage",
    description: "Unlocks the large supply depot construction blueprint.",
    silicateCost: 8,
    researchHours: 6,
    texture: "storage_large",
    unlocks: { moduleId: "storage_large" },
  },
  {
    id: "base_radar",
    category: "BASE",
    name: "Comms Radar",
    description: "Unlocks the radar module for sector scanning and communications.",
    silicateCost: 10,
    researchHours: 7,
    texture: "radar",
    unlocks: { moduleId: "radar" },
  },
  {
    id: "base_communication",
    category: "BASE",
    name: "Mission Control Uplink",
    description: "Unlocks the communication module for establishing the Earth uplink.",
    silicateCost: 12,
    researchHours: 7,
    texture: "communication",
    unlocks: { moduleId: "communication" },
  },
  {
    id: "tech_sample_extractor",
    category: "TECH",
    name: "Sample Extractor",
    description: "Unlocks the sample extractor module for collecting Martian samples.",
    silicateCost: 12,
    researchHours: 8,
    texture: "sample_extractor",
    unlocks: { moduleId: "sample_extractor" },
  },
  {
    id: "tech_beacon",
    category: "TECH",
    name: "Rescue Beacon",
    description: "Unlocks the emergency distress beacon blueprint for evacuation.",
    silicateCost: 15,
    researchHours: 6,
    texture: "beacon",
    unlocks: { moduleId: "beacon" },
  },
];

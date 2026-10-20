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
    researchHours: 1,
    texture: "meal",
    unlocks: { resource: "meal" },
  },
  {
    id: "food_good_meal",
    category: "FOOD",
    name: "Nutritional Optimization",
    description: "Unlocks the high-nutrition good meal recipe.",
    silicateCost: 6,
    researchHours: 2,
    requires: ["food_meal"],
    texture: "good_meal",
    unlocks: { resource: "good_meal" },
  },
  {
    id: "tech_radiation_filter",
    category: "TECH",
    name: "Radiation Filtration",
    description: "Unlocks the radiation filter fabrication recipe.",
    silicateCost: 5,
    researchHours: 2,
    texture: "radiation_filter",
    unlocks: { resource: "radiation_filter" },
  },
  {
    id: "tech_radiation_filter_efficiency",
    category: "TECH",
    name: "Radiation Filter Efficiency",
    description: "Improves the operating efficiency of radiation filters.",
    silicateCost: 8,
    researchHours: 3,
    requires: ["tech_radiation_filter"],
    texture: "radiation_filter",
    unlocks: { efficiencyKey: "radiation_filter" },
  },
  {
    id: "tech_water_filter",
    category: "TECH",
    name: "Water Filtration",
    description: "Unlocks the water filter fabrication recipe.",
    silicateCost: 4,
    researchHours: 2,
    texture: "water_filter",
    unlocks: { resource: "water_filter" },
  },
  {
    id: "tech_water_filter_efficiency",
    category: "TECH",
    name: "Water Filter Efficiency",
    description: "Improves the operating efficiency of water filters.",
    silicateCost: 7,
    researchHours: 3,
    requires: ["tech_water_filter"],
    texture: "water_filter",
    unlocks: { efficiencyKey: "water_filter" },
  },
  {
    id: "tech_air_filter",
    category: "TECH",
    name: "Air Filtration",
    description: "Unlocks the air filter fabrication recipe.",
    silicateCost: 4,
    researchHours: 2,
    texture: "air_filter",
    unlocks: { resource: "air_filter" },
  },
  {
    id: "tech_air_filter_efficiency",
    category: "TECH",
    name: "Air Filter Efficiency",
    description: "Improves the operating efficiency of air filters.",
    silicateCost: 7,
    researchHours: 3,
    requires: ["tech_air_filter"],
    texture: "air_filter",
    unlocks: { efficiencyKey: "air_filter" },
  },
  {
    id: "base_radiation_tower",
    category: "BASE",
    name: "Rad-Shield Tower",
    description: "Unlocks construction of the radiation protection tower.",
    silicateCost: 15,
    researchHours: 4,
    texture: "radiation_tower",
    unlocks: { moduleId: "radiation_tower" },
  },
  {
    id: "base_large_storage",
    category: "BASE",
    name: "Automated Logistics",
    description: "Unlocks the large supply depot construction blueprint.",
    silicateCost: 8,
    researchHours: 3,
    texture: "storage_large",
    unlocks: { moduleId: "storage_large" },
  },
  {
    id: "base_radar",
    category: "BASE",
    name: "Comms Radar",
    description: "Unlocks the radar module for sector scanning and communications.",
    silicateCost: 10,
    researchHours: 3,
    texture: "radar",
    unlocks: { moduleId: "radar" },
  },
  {
    id: "base_communication",
    category: "BASE",
    name: "Mission Control Uplink",
    description: "Unlocks the communication module for establishing the Earth uplink.",
    silicateCost: 12,
    researchHours: 3,
    texture: "communication",
    unlocks: { moduleId: "communication" },
  },
];

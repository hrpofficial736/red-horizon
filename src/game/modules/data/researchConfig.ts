export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  silicateCost: number; // Cost to research
  unlocksModuleId: string; // The matching module ID string in MODULES
  isResearched: boolean;
}

export const RESEARCH_TREE: ResearchNode[] = [
  {
    id: "tech_rad_tower",
    name: "🛡️ Aegis Electromagnetic Shielding",
    description:
      "Unlocks the Blueprint for the Radiation Tower module to protect the base layout context on Sol 29.",
    silicateCost: 15,
    unlocksModuleId: "radiation_tower", // Links straight to the MODULES config key
    isResearched: false,
  },
  {
    id: "tech_large_storage",
    name: "📦 Automated Logistics Distribution",
    description:
      "Unlocks the Blueprint for the Automated Logistics Hub (Large Storage) module.",
    silicateCost: 8,
    unlocksModuleId: "storage_large",
    isResearched: false,
  },
];

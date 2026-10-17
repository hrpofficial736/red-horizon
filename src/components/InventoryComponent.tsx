import React from "react";
import { useGameStore } from "../store/useGameStore";
import type { ResourceType } from "../game/modules/module.types";

export const InventoryComponent: React.FC = () => {
  const inventory = useGameStore((state) => state.inventory);
  const craftItem = useGameStore((state) => state.craftItem);

  const recipes: Array<{
    output: ResourceType;
    cost: Array<{ resource: ResourceType; amount: number }>;
    label: string;
  }> = [
    {
      output: "iron_plate",
      cost: [{ resource: "iron_ore", amount: 3 }],
      label: "⚙️ Forge Iron Plate (3x Ore)",
    },
    {
      output: "glass_panel",
      cost: [{ resource: "silicates", amount: 3 }],
      label: "🪟 Fuse Glass Panel (3x Silicate)",
    },
    {
      output: "repair_kit",
      cost: [
        { resource: "iron_plate", amount: 1 },
        { resource: "electronics", amount: 1 },
      ],
      label: "🔧 Assembly Maintenance Kit",
    },
  ];

  return (
    <div className="grid grid-cols-2 h-full gap-4 overflow-hidden">
      {/* STOCKPILE ITEM GRID DISPLAY */}
      <div className="border border-neutral-800 rounded bg-neutral-900/20 p-3 overflow-y-auto">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 border-b border-neutral-800 pb-2">
          📦 Stockpile Inventories
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(inventory).map(([resourceKey, amount]) => (
            <div
              key={resourceKey}
              className="bg-neutral-900 border border-neutral-800 p-2 rounded flex justify-between items-center"
            >
              <span className="capitalize text-neutral-400">
                {resourceKey.replace("_", " ")}
              </span>
              <strong className="text-white text-sm bg-black px-2 py-0.5 rounded border border-neutral-800">
                {amount}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* WORKSHOP REFINING SUB-ACTIONS */}
      <div className="border border-neutral-800 rounded bg-neutral-900/20 p-3 overflow-y-auto flex flex-col gap-3">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
          🏭 Fabricator Unit Processes
        </h3>
        {recipes.map((recipe, index) => (
          <button
            key={index}
            onClick={() => {
              const success = craftItem(recipe.output, recipe.cost);
              if (!success)
                alert(
                  "MANUFACTURING REFUSAL: Missing required structural input assets.",
                );
            }}
            className="w-full text-left bg-neutral-900 border border-neutral-700 hover:border-orange-500 p-3 rounded text-xs transition-all duration-150 flex flex-col gap-1"
          >
            <span className="font-bold text-white">{recipe.label}</span>
            <span className="text-[10px] text-neutral-400">
              Needs:{" "}
              {recipe.cost
                .map((c) => `${c.amount}x ${c.resource.replace("_", " ")}`)
                .join(", ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

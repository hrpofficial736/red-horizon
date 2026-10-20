import React, { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { MAT_IMPORTS } from "../game/utils/materialsTexture";
import borders from "../assets/Border.png";
import bigBorder from "../assets/BigBorder.png";
import type { CraftingRecipe } from "../game/modules/data/recipesConfig";
import { INVENTORY_RECIPES } from "../game/modules/data/recipesConfig";

export const InventoryComponent: React.FC = () => {
  const inventory = useGameStore((state) => state.inventory);
  const discoveredResourceTypes = useGameStore(
    (state) => state.discoveredResourceTypes,
  );
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(
    null,
  );

  // console.log("InventoryComponent rendered with inventory:", inventory);

  return (
    <div className="flex flex-row h-full gap-4 overflow-hidden">
      {/* STOCKPILE ITEM GRID DISPLAY */}
      <section className="rounded-xl w-4/6 overflow-y-auto scrollbar-none">
        {/* <h3 className="text-md font-bold text-white uppercase tracking-widest mb-3 flex flex-row items-center gap-2">
          <CirclePile size={16} /> Stockpile Inventories
        </h3> */}
        <div className="flex flex-wrap gap-2 text-xs">
          {discoveredResourceTypes.map((resourceKey) => (
            <div
              onMouseEnter={() => {
                const recipe = INVENTORY_RECIPES.find(
                  (r) => r.output === resourceKey,
                );
                setSelectedRecipe(recipe || null);
              }}
              onMouseLeave={() => setSelectedRecipe(null)}
              key={resourceKey}
              className="w-[calc(25%-0.4rem)] hover:text-black hover:bg-white aspect-5/4 bg-neutral-900 border border-neutral-800 p-2 rounded-xl flex flex-col gap-1 justify-between items-center"
            >
              <span className="capitalize font-medium">
                {resourceKey.replace("_", " ")}
              </span>
              <img
                src={MAT_IMPORTS[resourceKey]}
                alt={resourceKey.replace("_", " ")}
                className={`w-[calc(80%-1rem)] aspect-square object-contain pointer-events-none`}
              />
              <strong className=" text-sm w-full text-right">
                x{inventory[resourceKey] ?? 0}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-2/6 rounded-2xl bg-black/55 overflow-hidden">
        {selectedRecipe ? (
          <div className="w-full flex flex-col items-center justify-between gap-5 p-4">
            <div className="w-full flex flex-col gap-4 items-center">
              <div
                style={{ backgroundImage: `url(${borders})` }}
                className="w-[90%] aspect-square bg-no-repeat object-contain bg-center flex items-center justify-center"
              >
                <img
                  src={MAT_IMPORTS[selectedRecipe.output]}
                  alt=""
                  className="pointer-events-none aspect-square w-[calc(60%-1rem)] object-contain"
                />
              </div>
              <div className="w-full flex flex-col gap-2">
                <span className=" text-xl font-bold leading-none">
                  {selectedRecipe.name.toUpperCase()}
                </span>
                <span className=" text-md font-medium leading-4.5 text-sec">
                  {selectedRecipe.description}
                </span>
              </div>
            </div>
            {/* <div className="w-full flex flex-row gap-2">
              <div className="w-full flex flex-col gap-1">
                <strong className="text-sm text-stone-400 uppercase tracking-wide">
                  RESOURCES
                </strong>
                <div className="w-full flex flex-row gap-3">
                  {selectedRecipe.cost.map((cost, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <img
                        src={MAT_ICONS[cost.resource]}
                        alt=""
                        className="pointer-events-none w-7 aspect-square object-contain"
                      />
                      <span className="text-sm font-bold">{cost.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full flex flex-col gap-1">
                <strong className="text-sm text-stone-400 uppercase tracking-wide text-right">
                  EST. TIME
                </strong>
                <strong className="text-sm text-white text-right">
                  {`${selectedRecipe.craftHours}h`}
                </strong>
              </div>
            </div> */}
            <div className="flex flex-row gap-2 w-full items-center">
              <div className="flex flex-col -space-y-1">
                <strong className="text-sm text-stone-400 uppercase tracking-wide">
                  AMOUNT IN
                </strong>
                <strong className="text-sm text-stone-400 uppercase tracking-wide text-right">
                  STORAGE
                </strong>
              </div>
              <strong className="bg-stone-700 text-xs h-6 w-6 text-white rounded-full flex items-center justify-center ">
                {inventory[selectedRecipe.output] || 0}
              </strong>
            </div>
          </div>
        ) : (
          <img
            src={bigBorder}
            alt=""
            className="w-full h-full pointer-events-none"
          />
        )}
      </section>

      {/* WORKSHOP REFINING SUB-ACTIONS */}
      {/* <div className="hidden w-1/2 border border-neutral-800 rounded bg-neutral-900/20 p-3 overflow-y-auto flex flex-col gap-3">
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
      </div> */}
    </div>
  );
};

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGameStore } from "../store/useGameStore";
import { MAT_IMPORTS } from "../game/utils/materialsTexture";
import borders from "../assets/Border.png";
import bigBorder from "../assets/BigBorder.png";
import type { CraftingRecipe } from "../game/modules/data/recipesConfig";
import { INVENTORY_RECIPES } from "../game/modules/data/recipesConfig";

export const InventoryComponent: React.FC = () => {
  const inventory = useGameStore((state) => state.inventory);
  const consumeResource = useGameStore((state) => state.consumeResource);
  const discoveredResourceTypes = useGameStore(
    (state) => state.discoveredResourceTypes,
  );
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(
    null,
  );
  const [contextMenu, setContextMenu] = useState<{
    resource: keyof typeof inventory;
    x: number;
    y: number;
  } | null>(null);
  const [disposeResource, setDisposeResource] = useState<
    keyof typeof inventory | null
  >(null);
  const [disposeAmount, setDisposeAmount] = useState(1);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;

    const closeContextMenu = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        contextMenuRef.current?.contains(event.target)
      ) {
        return;
      }

      setContextMenu(null);
    };

    document.addEventListener("mousedown", closeContextMenu);
    return () => document.removeEventListener("mousedown", closeContextMenu);
  }, [contextMenu]);

  const openDisposeModal = (resource: keyof typeof inventory) => {
    setContextMenu(null);
    setDisposeResource(resource);
    setDisposeAmount(Math.max(1, Math.floor((inventory[resource] ?? 0) / 2)));
  };

  const confirmDispose = () => {
    if (!disposeResource) return;
    consumeResource(disposeResource, disposeAmount);
    setDisposeResource(null);
  };

  // console.log("InventoryComponent rendered with inventory:", inventory);

  return (
    <div
      className="relative flex flex-row h-full gap-4 overflow-hidden"
      onClick={() => setContextMenu(null)}
    >
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
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setContextMenu({
                  resource: resourceKey,
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
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

      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            className="fixed z-[100] min-w-36 rounded-lg border border-neutral-700 bg-neutral-950 p-1 shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              disabled={(inventory[contextMenu.resource] ?? 0) < 1}
              onClick={() => openDisposeModal(contextMenu.resource)}
              className="w-full rounded px-3 py-2 text-left text-xs font-bold uppercase text-red-300 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Dismantle / Dispose
            </button>
          </div>,
          document.body,
        )}

      {disposeResource && (
        <div
          className="absolute inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setDisposeResource(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-950 p-5 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-300">
              Dismantle / Dispose
            </h3>
            <p className="mt-2 text-xs text-neutral-400">
              Select how many {disposeResource.replace("_", " ")} units to remove.
            </p>
            <div className="mt-5 flex items-center justify-between text-xs">
              <span>Quantity</span>
              <strong className="text-orange-300">
                {disposeAmount} / {inventory[disposeResource] ?? 0}
              </strong>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(1, inventory[disposeResource] ?? 0)}
              value={disposeAmount}
              onChange={(event) => setDisposeAmount(Number(event.target.value))}
              className="mt-3 w-full accent-orange-500"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDisposeResource(null)}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-bold uppercase text-neutral-300 hover:border-white"
              >
                Close
              </button>
              <button
                onClick={confirmDispose}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-red-400"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

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

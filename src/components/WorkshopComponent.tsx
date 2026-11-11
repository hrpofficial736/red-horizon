import { X } from "lucide-react";
import {
  KITCHEN_RECIPES,
  SAMPLE_EXTRACTOR_RECIPES,
  WORKSHOP_RECIPES,
  type CraftingRecipe,
} from "../game/modules/data/recipesConfig";
import { MAT_IMPORTS } from "../game/utils/materialsTexture";
import { hasOperationalPower, useGameStore } from "../store/useGameStore";
import { MAT_ICONS } from "../game/utils/matetialsIcons";
import { useState } from "react";
import bigBorder from "../assets/BigBorder.png";
import borders from "../assets/Border.png";

const formatGameTime = (absoluteHour: number) => {
  const totalMinutes = Math.round(absoluteHour * 60);
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatRemainingTime = (minutes: number) => {
  const totalMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

export function WorkshopComponent({
  isKitchen = false,
  isSampleExtractor = false,
}: {
  isKitchen?: boolean;
  isSampleExtractor?: boolean;
}) {
  const inventory = useGameStore((state) => state.inventory);
  const discoveredResourceTypes = useGameStore(
    (state) => state.discoveredResourceTypes,
  );
  const researchedNodeIds = useGameStore((state) => state.researchedNodeIds);
  const workshopQueue = useGameStore((state) => state.workshopQueue);
  const kitchenQueue = useGameStore((state) => state.kitchenQueue);
  const sampleExtractorQueue = useGameStore(
    (state) => state.sampleExtractorQueue,
  );
  const queueCrafting = useGameStore((state) => state.queueCrafting);
  const queueKitchenCrafting = useGameStore(
    (state) => state.queueKitchenCrafting,
  );
  const queueSampleExtractorCrafting = useGameStore(
    (state) => state.queueSampleExtractorCrafting,
  );
  const cancelCrafting = useGameStore((state) => state.cancelCrafting);
  const cancelKitchenCrafting = useGameStore(
    (state) => state.cancelKitchenCrafting,
  );
  const cancelSampleExtractorCrafting = useGameStore(
    (state) => state.cancelSampleExtractorCrafting,
  );
  const currentHour = useGameStore((state) => state.currentHour);
  const currentMinute = useGameStore((state) => state.currentMinute);
  const currentDay = useGameStore((state) => state.currentDay);
  const productionPausedAt = useGameStore(
    (state) =>
      state.placedModules.find(
        (module) =>
          module.id ===
          (isSampleExtractor
            ? "sample_extractor"
            : isKitchen
              ? "kitchen"
              : "workshop"),
      )?.productionPausedAt,
  );
  const productionModuleActive = useGameStore((state) =>
    hasOperationalPower(
      state.placedModules,
      state.powerBankCharge,
      state.currentHour,
      state.currentDay,
    ) &&
      state.placedModules.some(
        (module) =>
          module.id ===
            (isSampleExtractor
              ? "sample_extractor"
              : isKitchen
                ? "kitchen"
                : "workshop") &&
          module.active &&
          module.hp > 0,
      ),
  );
  const now = currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const progressNow = productionModuleActive
    ? now
    : Math.min(now, (productionPausedAt ?? now) * 60);
  const recipes = isSampleExtractor
    ? SAMPLE_EXTRACTOR_RECIPES
    : isKitchen
      ? KITCHEN_RECIPES
      : WORKSHOP_RECIPES;
  const queue = isSampleExtractor
    ? sampleExtractorQueue
    : isKitchen
      ? kitchenQueue
      : workshopQueue;
  const queueRecipe = isSampleExtractor
    ? queueSampleExtractorCrafting
    : isKitchen
      ? queueKitchenCrafting
      : queueCrafting;
  const cancelQueue = isSampleExtractor
    ? cancelSampleExtractorCrafting
    : isKitchen
      ? cancelKitchenCrafting
      : cancelCrafting;
  const researchedKitchenRecipes = new Set(
    [
      "soup",
      ...researchedNodeIds
        .map((nodeId) => {
          if (nodeId === "food_meal") return "meal";
          if (nodeId === "food_good_meal") return "good_meal";
          return null;
        })
        .filter(
          (resource): resource is "meal" | "good_meal" => resource !== null,
        ),
    ],
  );

  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(
    null,
  );

  return (
    <div className="flex h-full min-h-0 gap-4">
      <section className="flex w-3/7 flex-col overflow-hidden rounded-b-xl  bg-neutral-900/0 p-0">
        <h3 className="mb-3 pb-0 text-md font-bold uppercase tracking-widest text-white">
          Available Recipes
        </h3>
        <div className="flex flex-wrap gap-2 overflow-y-auto scrollbar-none">
          {recipes
            .filter((recipe) => {
              if (isSampleExtractor) return true;
              return isKitchen
                ? researchedKitchenRecipes.has(recipe.output)
                : discoveredResourceTypes.includes(recipe.output);
            })
            .map((recipe) => {
            const canAfford = recipe.cost.every(
              (cost) => (inventory[cost.resource] || 0) >= cost.amount,
            );
            return (
              <button
                key={recipe.output}
                disabled={!canAfford}
                onMouseEnter={() => setSelectedRecipe(recipe)}
                onMouseLeave={() => setSelectedRecipe(null)}
                onClick={() => queueRecipe(recipe)}
                className="flex flex-col w-[calc(33.3%-0.35rem)] aspect-3/4 justify-between items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition text-white hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="text-sm w-full text-left  font-bold leading-none">
                  {recipe.name.toUpperCase()}
                </span>
                <div className="relative  w-[calc(70%-1rem)] ">
                  <img
                    src={MAT_IMPORTS[recipe.output]}
                    alt=""
                    className="pointer-events-none w-full aspect-square  object-contain"
                  />
                  <div className="absolute h-6 w-6 bottom-1 right-1 text-xs bg-stone-700 rounded-full flex items-center justify-center ">
                    <strong className="text-sm text-white">
                      {inventory[recipe.output] || 0}
                    </strong>
                  </div>
                </div>
                <div className="min-w-0 flex flex-wrap items-center justify-start gap-2 w-full">
                  {recipe.cost.map((cost, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <img
                        src={MAT_ICONS[cost.resource]}
                        alt=""
                        className="pointer-events-none w-5 aspect-square object-contain"
                      />
                      <span className="text-sm font-bold">{cost.amount}</span>
                    </div>
                  ))}
                </div>
                {/* <span className="flex shrink-0 items-center gap-1 text-[10px] text-neutral-400">
                  <Clock3 size={12} /> {recipe.craftHours}h
                </span> */}
              </button>
            );
            })}
        </div>
      </section>

      <section className="flex w-2/7 flex-1 rounded-2xl bg-black/55 overflow-hidden">
        {selectedRecipe ? (
          <div className="w-full flex flex-col items-center justify-center gap-5 p-4">
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
            <div className="w-full flex flex-row gap-2">
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
            </div>
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

      <section className="flex w-2/7 flex-1 flex-col overflow-hidden rounded-b-xl p-0">
        <div className="mb-3 flex items-center justify-between ">
          <h3 className="text-md font-bold uppercase tracking-widest text-white">
            {isSampleExtractor
              ? "Sample Extractor Queue"
              : isKitchen
                ? "Kitchen Queue"
                : "Fabrication Queue"}
          </h3>
          <span className="text-[10px] text-sec">
            {queue.length} item{queue.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="min-h-0 space-y-2 overflow-y-auto scrollbar-none">
          {queue.length === 0 && (
            <p className="py-8 text-center text-xs italic text-neutral-600">
              Queue is idle. Select a recipe to reserve materials.
            </p>
          )}
          {queue.map((item, index) => {
            const isFinished =
              item.completed ||
              (productionModuleActive && item.completesAt * 60 <= progressNow);
            const isActive =
              !isFinished &&
              productionModuleActive &&
              !queue
                .slice(0, index)
                .some(
                  (queued) =>
                    !queued.completed && queued.completesAt * 60 > progressNow,
                );
            const totalMinutes = Math.max(
              1,
              Math.round((item.completesAt - item.startedAt) * 60),
            );
            const remainingMinutes = Math.max(
              0,
              Math.round(item.completesAt * 60 - progressNow),
            );
            const progress = isFinished
              ? 100
              : Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      ((progressNow - item.startedAt * 60) * 100) /
                        totalMinutes,
                    ),
                  ),
                );
            return (
              <div
                key={item.id}
                className={`rounded-xl p-3 ${
                  isFinished
                    ? "border-green-500/50 bg-black/50"
                    : isActive
                      ? "border-orange-500/70 bg-black"
                      : "border-neutral-800 bg-black"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs text-white uppercase tracking-wider">
                      {item.recipe.name}
                    </strong>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-neutral-500">
                      {isFinished
                        ? "Finished"
                        : !productionModuleActive
                          ? "Paused • module inactive"
                        : isActive
                          ? remainingMinutes === 0
                            ? "Completing this game hour"
                            : "Crafting"
                          : `Queued • starts at ${formatGameTime(item.startedAt)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => cancelQueue(item.id)}
                    aria-label={`Cancel ${item.recipe.name}`}
                    className="cursor-pointer rounded p-1 text-neutral-500 hover:bg-red-950 hover:text-red-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-neutral-500">
                    <strong className="text-neutral-300 text-[14px]">
                      {progress}%
                    </strong>
                    {isActive && !isFinished && (
                      <div className="text-[14px] uppercase tracking-wider text-orange-300">
                        {/* Time remaining:{" "} */}
                        <strong>
                          {remainingMinutes === 0
                            ? "Completing this game hour"
                            : formatRemainingTime(remainingMinutes)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className={`h-full rounded-full transition-[width] ${
                        isFinished ? "bg-green-400" : "bg-orange-400"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

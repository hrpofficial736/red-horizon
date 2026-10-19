import { X } from "lucide-react";
import { useState } from "react";
import {
  FOOD_PACK_RECIPES,
  type CraftingRecipe,
} from "../game/modules/data/recipesConfig";
import { MAT_ICONS } from "../game/utils/matetialsIcons";
import { useGameStore } from "../store/useGameStore";
import { MAT_IMPORTS } from "../game/utils/materialsTexture";
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
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60,
  ).padStart(2, "0")}`;
};

export function GreenhouseComponent() {
  const inventory = useGameStore((state) => state.inventory);
  const greenhouseQueue = useGameStore((state) => state.greenhouseQueue);
  const queueCrafting = useGameStore((state) => state.queueGreenhouseCrafting);
  const cancelCrafting = useGameStore(
    (state) => state.cancelGreenhouseCrafting,
  );
  const currentDay = useGameStore((state) => state.currentDay);
  const currentHour = useGameStore((state) => state.currentHour);
  const currentMinute = useGameStore((state) => state.currentMinute);
  const now = currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(
    null,
  );

  return (
    <div className="flex h-full min-h-0 gap-4">
      <section className="flex w-3/7 flex-col overflow-hidden">
        <h3 className="mb-3 text-md font-bold uppercase tracking-widest text-white">
          Available Recipes
        </h3>
        <div className="flex flex-wrap gap-2 overflow-y-auto scrollbar-none">
          {FOOD_PACK_RECIPES.map((recipe, index) => {
            const canAfford = recipe.cost.every(
              (cost) => (inventory[cost.resource] || 0) >= cost.amount,
            );
            return (
              <button
                key={`${recipe.output}-${recipe.outputAmount}-${index}`}
                disabled={!canAfford}
                onMouseEnter={() => setSelectedRecipe(recipe)}
                onMouseLeave={() => setSelectedRecipe(null)}
                onClick={() => queueCrafting(recipe)}
                className="flex aspect-3/4 w-[calc(33.3%-0.35rem)] flex-col items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left text-white transition hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="w-full text-sm font-bold leading-none">
                  {recipe.outputAmount}x {recipe.name.toUpperCase()}
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
                <div className="flex w-full flex-wrap items-center gap-2">
                  {recipe.cost.map((cost) => (
                    <div
                      key={cost.resource}
                      className="flex items-center gap-1"
                    >
                      <img
                        src={MAT_ICONS[cost.resource]}
                        alt=""
                        className="aspect-square w-5 object-contain"
                      />
                      <span className="text-sm font-bold">{cost.amount}</span>
                    </div>
                  ))}
                </div>
                {/* <span className="text-xs text-neutral-400">
                  {recipe.craftHours}h
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
                {selectedRecipe.outputAmount}x{" "}
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

      <section className="flex w-2/7 flex-1 flex-col overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-md font-bold uppercase tracking-widest text-white">
            Greenhouse Queue
          </h3>
          <span className="text-[10px] text-neutral-500">
            {greenhouseQueue.length} item
            {greenhouseQueue.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="space-y-2">
          {greenhouseQueue.length === 0 && (
            <p className="py-8 text-center text-xs italic text-neutral-600">
              Queue is idle. Select a food pack to begin cultivation.
            </p>
          )}
          {greenhouseQueue.map((item, index) => {
            const isFinished = item.completed || item.completesAt * 60 <= now;
            const isActive =
              !isFinished &&
              !greenhouseQueue
                .slice(0, index)
                .some(
                  (queued) =>
                    !queued.completed && queued.completesAt * 60 > now,
                );
            const totalMinutes = Math.max(
              1,
              Math.round((item.completesAt - item.startedAt) * 60),
            );
            const progress = isFinished
              ? 100
              : isActive
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(
                        ((now - item.startedAt * 60) * 100) / totalMinutes,
                      ),
                    ),
                  )
                : 0;
            const remainingMinutes = Math.max(
              0,
              Math.round(item.completesAt * 60 - now),
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
                    <strong className="block text-xs text-white">
                      {item.recipe.outputAmount}x {item.recipe.name}
                    </strong>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      {isFinished
                        ? "Finished"
                        : isActive
                          ? "Cultivating"
                          : `Queued • starts at ${formatGameTime(item.startedAt)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => cancelCrafting(item.id)}
                    aria-label={`Cancel ${item.recipe.name}`}
                    className="rounded p-1 text-neutral-500 hover:bg-red-950 hover:text-red-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[14px] uppercase">
                    <strong>{progress}%</strong>
                    {isActive && !isFinished && (
                      <div className=" text-[14px] uppercase text-orange-300">
                        <strong>{formatRemainingTime(remainingMinutes)}</strong>
                      </div>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className={`h-full ${
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

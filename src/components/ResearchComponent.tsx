import { useState } from "react";
import {
  RESEARCH_TREE,
  type ResearchCategory,
  type ResearchNode,
} from "../game/modules/data/researchConfig";
import { useGameStore } from "../store/useGameStore";
import borders from "../assets/Border.png";
import { MAT_ICONS } from "../game/utils/matetialsIcons";
import { ALL_TEXTURES } from "../game/utils/allTextures";
import unexplored from "../assets/unexplored.png";

const CATEGORIES: ResearchCategory[] = ["FOOD", "TECH", "BASE"];
const TECH_LANES = [
  ["tech_radiation_filter", "tech_radiation_filter_efficiency"],
  ["tech_water_filter", "tech_water_filter_efficiency"],
  ["tech_air_filter", "tech_air_filter_efficiency"],
] as const;

const formatRemainingTime = (hours: number) => {
  const totalMinutes = Math.max(0, Math.ceil(hours * 60));
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60,
  ).padStart(2, "0")}`;
};

export function ResearchComponent() {
  const inventory = useGameStore((state) => state.inventory);
  const researchQueue = useGameStore((state) => state.researchQueue);
  const researchedNodeIds = useGameStore((state) => state.researchedNodeIds);
  const queueResearch = useGameStore((state) => state.queueResearch);
  const cancelResearch = useGameStore((state) => state.cancelResearch);
  const currentDay = useGameStore((state) => state.currentDay);
  const currentHour = useGameStore((state) => state.currentHour);
  const currentMinute = useGameStore((state) => state.currentMinute);
  const now = currentDay * 24 + currentHour + currentMinute / 60;

  const [selectedNode, setSelectedNode] = useState<ResearchNode | null>(null);

  const renderNode = (node: ResearchNode) => {
    const researched = researchedNodeIds.includes(node.id);
    const queued = researchQueue.some((item) => item.node.id === node.id);
    const isNextUpgradeAvailable = (node.requires ?? []).every((requiredId) =>
      researchedNodeIds.includes(requiredId),
    );
    const hasEnoughResearchCost = inventory.silicates >= node.silicateCost;
    const isLocked = !isNextUpgradeAvailable;
    const canResearch =
      !researched &&
      !queued &&
      researchQueue.length < 2 &&
      isNextUpgradeAvailable &&
      hasEnoughResearchCost;

    return (
      <button
        key={node.id}
        disabled={researched || isLocked}
        onMouseEnter={() => setSelectedNode(node)}
        onMouseLeave={() => setSelectedNode(null)}
        onClick={() => {
          if (canResearch) queueResearch(node);
        }}
        className={`relative max-w-full rounded-xl p-0 text-left transition flex flex-col gap-1 min-h-34 ${
          (isLocked || researched ) ??
          "cursor-not-allowed"
        }`}
      >
        <div
          className={`border border-neutral-800 p-3 rounded-2xl ${
            researched
              ? "bg-white"
              : isLocked || queued || researchQueue.length >= 2
                ? "bg-neutral-900 opacity-45"
                : "bg-neutral-900"
          } ${
            isLocked || researched
              ? "cursor-not-allowed"
              : "hover:border-white"
          }`}
        >
          <img
            src={isLocked ? unexplored : ALL_TEXTURES[node.texture ?? ""]}
            alt=""
            className={`${researched ? "grayscale-0" : "grayscale-100"} pointer-events-none aspect-square w-30 object-contain`}
          />
        </div>
        {!isLocked ? (
          <span className="block text-[10px] font-bold text-center text-white px-2">
            {node.name}
          </span>
        ) : null}

        {/* <span className="block text-xs font-bold text-white">{node.name}</span>
        <span className="mt-1 block text-[10px] leading-tight text-neutral-400">
          {node.description}
        </span> */}
        {/* <span className="mt-2 block text-[10px] font-bold text-orange-300">
          {researched
            ? node.unlocks?.efficiencyKey
              ? `RESEARCHED // EFFICIENCY LEVEL ${filterEfficiency[node.unlocks.efficiencyKey] ?? 0}`
              : "RESEARCHED"
            : queued
              ? "QUEUED"
              : `${node.silicateCost} SILICATES // ${node.researchHours}H`}
        </span> */}
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-0 gap-4">
      <section className="min-w-0 flex-1 overflow-y-auto pr-2 scrollbar-none">
        <div className="flex flex-row gap-3">
          {CATEGORIES.map((category) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="border-b border-neutral-700 pb-2 text-sm font-bold tracking-widest text-white">
                {category}
              </h3>
              {category === "TECH" ? (
                <div className="flex flex-row gap-2">
                  {TECH_LANES.map((lane) => (
                    <div key={lane[0]} className="flex flex-col gap-2">
                      {lane.map((nodeId) => {
                        const node = RESEARCH_TREE.find(
                          (candidate) => candidate.id === nodeId,
                        );
                        return node ? renderNode(node) : null;
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {RESEARCH_TREE.filter(
                    (node) => node.category === category,
                  ).map(renderNode)}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <aside className="flex w-1/3 min-w-64 flex-col rounded-2xl bg-black/55 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-widest text-white">
            RESEARCH QUEUE
          </h3>
          <span className="text-[10px] text-neutral-500">
            {researchQueue.length}/2 SLOTS
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-2 overflow-y-auto">
            {researchQueue.map((item, index) => {
              const remaining =
                index === 0 ? item.completesAt - now : item.completesAt - now;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {index + 1}. {item.node.name}
                    </span>
                    <button
                      onClick={() => cancelResearch(item.id)}
                      className="text-[10px] text-neutral-500 hover:text-white"
                    >
                      CANCEL
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
                    <span>{index === 0 ? "PROCESSING" : "WAITING"}</span>
                    <span>{formatRemainingTime(remaining)}</span>
                  </div>
                </div>
              );
            })}
            {researchQueue.length === 0 && (
              <span className="py-8 text-center text-xs italic text-neutral-500">
                Select a research node to begin.
              </span>
            )}
          </div>
          <div className="flex flex-col w-full aspect-5/6 p-3 bg-black/55 rounded-2xl">
            {selectedNode ? (
              <div className="flex flex-col h-full items-center justify-between">
                <div className="flex w-full flex-col items-center gap-4">
                  <div
                    style={{
                      backgroundImage: `url(${borders})`,
                      backgroundSize: "cover",
                    }}
                    className="w-[50%] aspect-square bg-no-repeat object-contain bg-center flex items-center justify-center"
                  >
                    <img
                      src={ALL_TEXTURES[selectedNode.texture ?? ""]}
                      alt=""
                      className="pointer-events-none aspect-square w-[calc(80%-1rem)] object-contain"
                    />
                  </div>
                  <div className="w-full flex flex-col gap-2">
                    <span className=" text-lg font-bold leading-none">
                      {selectedNode.name.toUpperCase()}
                    </span>
                    <span className=" text-sm font-medium leading-4.5 text-sec">
                      {selectedNode.description}
                    </span>
                  </div>
                </div>

                <div className="w-full flex flex-row justify-between">
                  <div className="w-full flex flex-col gap-1">
                    <strong className="text-sm text-stone-400 uppercase tracking-wide">
                      COST
                    </strong>
                    <div className="w-full flex flex-row gap-3">
                      <div className="flex items-center gap-1 text-[10px]">
                        <img
                          src={MAT_ICONS["silicates"]}
                          alt=""
                          className="pointer-events-none w-7 aspect-square object-contain"
                        />
                        <span className="text-sm font-bold">
                          {selectedNode.silicateCost}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex flex-col gap-1">
                    <strong className="text-sm text-stone-400 uppercase tracking-wide text-right">
                      EST. TIME
                    </strong>
                    <strong className="text-sm text-white text-right">
                      {`${selectedNode.researchHours}h`}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <span className="py-8 text-center text-xs italic text-neutral-500">
                Hover over a research node to see details.
              </span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

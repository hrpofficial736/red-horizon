import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import type { ResourceType } from "../game/modules/module.types";

type QuestBlock = {
  id: string;
  taskLabel: string;
  heading: string;
  lines: Array<{ text: string; done: boolean }>;
  complete: boolean;
  optional?: boolean;
  optionalNote?: string;
};

const hasBuilt = (
  placedModules: Array<{
    id: string;
    hp: number;
    constructionHoursRemaining?: number;
  }>,
  moduleId: string,
) =>
  placedModules.some(
    (module) =>
      module.id === moduleId &&
      module.hp > 0 &&
      (module.constructionHoursRemaining ?? 0) <= 0,
  );

export function QuestPanel() {
  const currentDay = useGameStore((state) => state.currentDay);
  const placedModules = useGameStore((state) => state.placedModules);
  const researchedNodeIds = useGameStore((state) => state.researchedNodeIds);
  const inventory = useGameStore((state) => state.inventory);
  const isCommsEstablished = useGameStore((state) => state.isCommsEstablished);
  const earthReportSent = useGameStore((state) => state.earthReportSent);
  const stormAlertReceived = useGameStore(
    (state) => state.stormAlertReceived,
  );
  const rescueMissionInitialized = useGameStore(
    (state) => state.rescueMissionInitialized,
  );
  const foodStockpileTaskStartDay = useGameStore(
    (state) => state.foodStockpileTaskStartDay,
  );
  const startFoodStockpileTask = useGameStore(
    (state) => state.startFoodStockpileTask,
  );

  const hasSolar = hasBuilt(placedModules, "solar");
  const hasBattery = hasBuilt(placedModules, "battery");
  const hasWorkshop = hasBuilt(placedModules, "workshop");
  const hasWaterExtractor = hasBuilt(placedModules, "water");
  const hasDrill = hasBuilt(placedModules, "drill");
  const hasKitchen = hasBuilt(placedModules, "kitchen");
  const hasGreenhouse = hasBuilt(placedModules, "greenhouse");
  const hasResearchLab = hasBuilt(placedModules, "researchLab");
  const hasRadiationTower = hasBuilt(placedModules, "radiation_tower");
  const hasRadar = hasBuilt(placedModules, "radar");
  const hasUplink = hasBuilt(placedModules, "communication");

  const task1Complete = hasSolar;
  const task2Complete = hasBattery;
  const task3Complete = hasWorkshop;
  const task4Complete = hasWaterExtractor && hasDrill;
  const task5Complete = hasKitchen && hasGreenhouse;
  const foodResources: ResourceType[] = [
    "raw_food",
    "soup",
    "meal",
    "good_meal",
  ];
  const foodCount = foodResources.reduce(
    (total, resource) => total + (inventory[resource] || 0),
    0,
  );
  const task6Complete =
    foodStockpileTaskStartDay !== null &&
    currentDay > foodStockpileTaskStartDay &&
    foodCount >= 7;
  const task7Complete = hasResearchLab;
  const task8Complete = researchedNodeIds.length > 0;
  const extractorResearchComplete = researchedNodeIds.includes(
    "tech_sample_extractor",
  );
  const hasSampleExtractor = hasBuilt(placedModules, "sample_extractor");
  const hasBeacon = hasBuilt(placedModules, "beacon");
  const hasSample = (inventory.mars_sample ?? 0) >= 1;

  useEffect(() => {
    if (task5Complete) startFoodStockpileTask();
  }, [startFoodStockpileTask, task5Complete]);

  const foodStockpileDueDay = (foodStockpileTaskStartDay ?? currentDay) + 3;
  const foodStockpileExpired =
    foodStockpileTaskStartDay !== null &&
    !task6Complete &&
    currentDay > foodStockpileDueDay;
  const optionalTowerStartDay = 1;
  const optionalTowerDeadlineDays = 3;
  const optionalTowerDueDay = optionalTowerStartDay + optionalTowerDeadlineDays;
  const optionalTowerExpired =
    !hasRadiationTower && currentDay > optionalTowerDueDay;

  const mandatoryBlocks: QuestBlock[] = [
    {
      id: "task-1",
      taskLabel: "TASK1",
      heading: "Solar Array",
      complete: task1Complete,
      lines: [{ text: "Build solar array module", done: hasSolar }],
    },
    {
      id: "task-2",
      taskLabel: "TASK2",
      heading: "Power Station Bank",
      complete: task2Complete,
      lines: [{ text: "Build power station bank", done: hasBattery }],
    },
    {
      id: "task-3",
      taskLabel: "TASK3",
      heading: "Workshop",
      complete: task3Complete,
      lines: [{ text: "Build workshop module", done: hasWorkshop }],
    },
    {
      id: "task-4",
      taskLabel: "TASK4",
      heading: "Essentials",
      complete: task4Complete,
      lines: [
        { text: "Build water extractor", done: hasWaterExtractor },
        { text: "Build regolith extractor", done: hasDrill },
      ],
    },
    {
      id: "task-5",
      taskLabel: "TASK5",
      heading: "Kitchen and Greenhouse",
      complete: task5Complete,
      lines: [
        { text: "Build greenhouse module", done: hasGreenhouse },
        { text: "Build kitchen module", done: hasKitchen },
      ],
    },
    {
      id: "task-6",
      taskLabel: "TASK6",
      heading: "Food Stockpile",
      complete: task6Complete,
      lines: [
        {
          text: "Store 7 days of food in inventory",
          done: task6Complete,
        },
      ],
      optionalNote: foodStockpileExpired
        ? "Window expired. Keep the food stocked anyway."
        : `Complete by Sol ${String(foodStockpileDueDay).padStart(2, "0")}`,
    },
    {
      id: "task-7",
      taskLabel: "TASK7",
      heading: "Research Foundation",
      complete: task7Complete,
      lines: [{ text: "Build research lab module", done: hasResearchLab }],
    },
    {
      id: "task-8",
      taskLabel: "TASK8",
      heading: "Science Progress",
      complete: task8Complete,
      lines: [
        {
          text: "Research at least one tech",
          done: task8Complete,
        },
      ],
    },
  ];

  const firstIncompleteMandatory = mandatoryBlocks.find(
    (block) => !block.complete,
  );

  const blocks: QuestBlock[] = firstIncompleteMandatory
    ? [firstIncompleteMandatory]
    : [];

  if (
    task1Complete &&
    task2Complete &&
    task3Complete &&
    task4Complete &&
    task5Complete &&
    task7Complete
  ) {
    const optionalBlock: QuestBlock = {
      id: "task-optional",
      taskLabel: "TASK8",
      heading: "Optional Shield Window",
      complete: hasRadiationTower,
      optional: true,
      optionalNote: optionalTowerExpired
        ? "Window expired. You can still build it any time."
        : `Complete by Sol ${String(optionalTowerDueDay).padStart(2, "0")}`,
      lines: [{ text: "Build radiation tower", done: hasRadiationTower }],
    };

    const friendlyBlock: QuestBlock = {
      id: "task-friendly",
      taskLabel: "TASK9",
      heading: "Friendly Connection",
      complete:
        hasRadar && hasUplink && isCommsEstablished && earthReportSent,
      lines: [
        { text: "Build radar module", done: hasRadar },
        { text: "Build uplink module", done: hasUplink },
        {
          text: "Establish connection with Earth",
          done: isCommsEstablished,
        },
        { text: "Send the outpost status report", done: earthReportSent },
      ],
    };

    if (!optionalBlock.complete) blocks.push(optionalBlock);
    if (!friendlyBlock.complete) blocks.push(friendlyBlock);

    if (stormAlertReceived && earthReportSent && friendlyBlock.complete) {
      const missionBlocks: QuestBlock[] = [
        {
          id: "storm-research",
          taskLabel: "TASK10",
          heading: "Storm Response Research",
          complete: extractorResearchComplete,
          lines: [
            {
              text: "Research the sample extractor technology",
              done: extractorResearchComplete,
            },
          ],
        },
        {
          id: "storm-extractor",
          taskLabel: "TASK11",
          heading: "Sample Extractor",
          complete: hasSampleExtractor,
          lines: [
            {
              text: "Construct the sample extractor",
              done: hasSampleExtractor,
            },
          ],
        },
        {
          id: "storm-sample",
          taskLabel: "TASK12",
          heading: "Martian Sample",
          complete: hasSample,
          lines: [{ text: "Extract 1 Martian sample", done: hasSample }],
        },
        {
          id: "storm-beacon",
          taskLabel: "TASK13",
          heading: "Rescue Beacon",
          complete: hasBeacon,
          lines: [{ text: "Build the rescue beacon", done: hasBeacon }],
        },
        {
          id: "storm-rescue",
          taskLabel: "TASK14",
          heading: "Evacuation",
          complete: rescueMissionInitialized,
          lines: [
            {
              text: "Initialize the rescue mission from the uplink",
              done: rescueMissionInitialized,
            },
          ],
        },
      ];
      const nextMissionBlock = missionBlocks.find((block) => !block.complete);
      if (nextMissionBlock) blocks.push(nextMissionBlock);
    }
  }

  const currentBlock = blocks[0] ?? null;
  const [displayedBlock, setDisplayedBlock] = useState<QuestBlock | null>(
    currentBlock,
  );
  const [animation, setAnimation] = useState<"enter" | "exit" | "idle">(
    "enter",
  );

  useEffect(() => {
    if (!currentBlock) return;
    if (!displayedBlock) return;
    if (displayedBlock.id === currentBlock.id) {
      return;
    }

    const completedBlock =
      mandatoryBlocks.find((block) => block.id === displayedBlock.id) ??
      displayedBlock;

    // Keep the completed task visible so its lines can strike through before
    // the next task enters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayedBlock(completedBlock);
    setAnimation("exit");
    const timer = window.setTimeout(() => {
      setDisplayedBlock(currentBlock);
      setAnimation("enter");
    }, 350);
    return () => window.clearTimeout(timer);
  // The IDs intentionally control this transition; object identity changes
  // while the same task is displayed must not restart the animation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlock?.id, displayedBlock?.id]);

  const blockToRender =
    displayedBlock && currentBlock?.id === displayedBlock.id
      ? currentBlock
      : displayedBlock;

  return (
    <div className="pointer-events-none absolute right-4 top-52 z-20 w-70 space-y-2">
      {blockToRender && (
        <section
          key={blockToRender.id}
          className={`rounded-xl border border-neutral-800 bg-neutral-950/85 p-3 font-mono text-white shadow-2xl backdrop-blur ${
            animation === "enter"
              ? "quest-task-enter"
              : animation === "exit"
                ? "quest-task-exit"
                : ""
          }`}
        >
          <h3 className="mb-1 text-[13px] font-bold leading-tight text-orange-200">
            {blockToRender.taskLabel}: {blockToRender.heading}
          </h3>
          {(blockToRender.optional || blockToRender.id === "task-6") && (
            <p
              className={`mb-2 text-[10px] uppercase tracking-wide ${
                (blockToRender.id === "task-6" && foodStockpileExpired) ||
                (blockToRender.id !== "task-6" &&
                  optionalTowerExpired &&
                  !hasRadiationTower)
                  ? "text-amber-300"
                  : "text-neutral-400"
              }`}
            >
              {blockToRender.optionalNote}
            </p>
          )}
          <div className="space-y-1">
            {blockToRender.lines.map((line) => (
              <p
                key={line.text}
                className={`text-sm leading-tight ${
                  line.done
                    ? "text-emerald-300 line-through"
                    : "text-neutral-100"
                }`}
              >
                • {line.done ? "✓ " : ""}
                {line.text}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

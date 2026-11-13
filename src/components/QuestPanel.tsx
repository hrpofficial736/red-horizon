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
  const SUPPLY_DEPOT_UNLOCK_DAY = 10;
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const currentDay = useGameStore((state) => state.currentDay);
  const placedModules = useGameStore((state) => state.placedModules);
  const researchedNodeIds = useGameStore((state) => state.researchedNodeIds);
  const inventory = useGameStore((state) => state.inventory);
  const isCommsEstablished = useGameStore((state) => state.isCommsEstablished);
  const earthReportSent = useGameStore((state) => state.earthReportSent);
  const stormAlertReceived = useGameStore((state) => state.stormAlertReceived);
  const rescueMissionInitialized = useGameStore(
    (state) => state.rescueMissionInitialized,
  );
  const foodStockpileTaskStartDay = useGameStore(
    (state) => state.foodStockpileTaskStartDay,
  );
  const startFoodStockpileTask = useGameStore(
    (state) => state.startFoodStockpileTask,
  );
  const foodStockpileTaskCompleted = useGameStore(
    (state) => state.foodStockpileTaskCompleted,
  );
  const completeFoodStockpileTask = useGameStore(
    (state) => state.completeFoodStockpileTask,
  );
  const radiationTowerTaskStartDay = useGameStore(
    (state) => state.radiationTowerTaskStartDay,
  );
  const startRadiationTowerTask = useGameStore(
    (state) => state.startRadiationTowerTask,
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
  const hasSmallStorage = hasBuilt(placedModules, "storage_small");

  const task1Complete = hasSolar;
  const task2Complete = hasBattery;
  const task3Complete = hasWorkshop;
  const task4Complete = hasWaterExtractor && hasDrill;
  const task5Complete = hasKitchen && hasGreenhouse;
  const foodResources: ResourceType[] = ["soup", "meal", "heavy_meal"];
  const foodCount = foodResources.reduce(
    (total, resource) => total + (inventory[resource] || 0),
    0,
  );
  const task6Complete =
    foodStockpileTaskCompleted ||
    (foodStockpileTaskStartDay !== null &&
      currentDay > foodStockpileTaskStartDay &&
      foodCount >= 7);
  const task7Complete = hasResearchLab;
  const task8Complete = hasRadiationTower;

  const extractorResearchComplete = researchedNodeIds.includes(
    "tech_sample_extractor",
  );
  const hasSampleExtractor = hasBuilt(placedModules, "sample_extractor");
  const beaconResearchComplete = researchedNodeIds.includes("tech_beacon");
  const hasBeacon = hasBuilt(placedModules, "beacon");
  const hasSample = (inventory.mars_sample ?? 0) >= 1;

  useEffect(() => {
    if (task5Complete) startFoodStockpileTask();
  }, [startFoodStockpileTask, task5Complete]);

  useEffect(() => {
    if (task6Complete && !foodStockpileTaskCompleted) {
      completeFoodStockpileTask();
    }
  }, [completeFoodStockpileTask, foodStockpileTaskCompleted, task6Complete]);

  useEffect(() => {
    if (task7Complete) startRadiationTowerTask();
  }, [startRadiationTowerTask, task7Complete]);

  const foodStockpileDueDay = (foodStockpileTaskStartDay ?? currentDay) + 3;
  const foodStockpileExpired =
    foodStockpileTaskStartDay !== null &&
    !task6Complete &&
    currentDay > foodStockpileDueDay;

  const towerTaskPassed2Days =
    radiationTowerTaskStartDay !== null &&
    currentDay >= radiationTowerTaskStartDay + 2;

  // Notify player when Task 9 parallel unlock occurs
  useEffect(() => {
    if (
      task7Complete &&
      !hasRadiationTower &&
      towerTaskPassed2Days &&
      radiationTowerTaskStartDay !== null
    ) {
      const logs = useGameStore.getState().gameLogs;
      const alreadyNotified = logs.some((l) =>
        l.includes("TASK 09 AVAILABLE"),
      );
      if (!alreadyNotified) {
        useGameStore.setState({
          gameLogs: [
            ...logs,
            "📡 MISSION UPDATE: TASK 09 AVAILABLE (Friendly Connection) in parallel with Radiation Shield.",
          ],
        });
      }
    }
  }, [
    task7Complete,
    hasRadiationTower,
    towerTaskPassed2Days,
    radiationTowerTaskStartDay,
  ]);

  // Notify player on Sol 6 storage mission
  useEffect(() => {
    if (currentDay >= 6 && !hasSmallStorage) {
      const logs = useGameStore.getState().gameLogs;
      const alreadyNotified = logs.some((l) =>
        l.includes("Sol 6 objective available"),
      );
      if (!alreadyNotified) {
        useGameStore.setState({
          gameLogs: [
            ...logs,
            "📦 MISSION UPDATE: Sol 6 objective available: Construct a Supply Depot (S).",
          ],
        });
      }
    }
  }, [currentDay, hasSmallStorage]);

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
  ];

  const task8Block: QuestBlock = {
    id: "task-8",
    taskLabel: "TASK8",
    heading: "Radiation Shield",
    complete: task8Complete,
    lines: [
      {
        text: "Research rad-shield tower",
        done: researchedNodeIds.includes("base_radiation_tower"),
      },
      { text: "Build radiation tower", done: hasRadiationTower },
    ],
  };

  const friendlyBlock: QuestBlock = {
    id: "task-friendly",
    taskLabel: "TASK9",
    heading: "Friendly Connection",
    complete: hasRadar && hasUplink && isCommsEstablished && earthReportSent,
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
      lines: [
        {
          text: "Research the rescue beacon",
          done: beaconResearchComplete,
        },
        { text: "Build the rescue beacon", done: hasBeacon },
      ],
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

  const sol10StorageBlock: QuestBlock = {
    id: "task-sol10-storage",
    taskLabel: "SOL 6",
    heading: "Supply Depot",
    complete: hasSmallStorage,
    lines: [{ text: "Build supply depot (S)", done: hasSmallStorage }],
  };

  useEffect(() => {
    setCompletedTaskIds((prev) => {
      const next = [...prev];
      const lockable = [
        ...mandatoryBlocks.map((block) => block.id),
        task8Block.id,
        friendlyBlock.id,
        ...missionBlocks.map((block) => block.id),
        sol10StorageBlock.id,
      ];
      let changed = false;
      for (const id of lockable) {
        const block = [
          ...mandatoryBlocks,
          task8Block,
          friendlyBlock,
          ...missionBlocks,
          sol10StorageBlock,
        ].find((candidate) => candidate.id === id);
        if (block && block.complete && !next.includes(id)) {
          next.push(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [
    mandatoryBlocks,
    task8Complete,
    friendlyBlock.complete,
    missionBlocks,
    hasSmallStorage,
    currentDay,
  ]);

  const activeBlocks: QuestBlock[] = [];

  const keepVisible = (blockId: string) => !completedTaskIds.includes(blockId);

  // Linear progression for Tasks 1-7
  const earlyTask = mandatoryBlocks
    .filter((block) => keepVisible(block.id))
    .find((block) => !block.complete);
  if (earlyTask) {
    activeBlocks.push(earlyTask);
  } else {
    if (keepVisible(task8Block.id) && !task8Complete) {
      activeBlocks.push(task8Block);
    }

    if (task8Complete || towerTaskPassed2Days) {
      if (keepVisible(friendlyBlock.id) && !friendlyBlock.complete) {
        activeBlocks.push(friendlyBlock);
      } else if (stormAlertReceived && earthReportSent) {
        const nextMissionBlock = missionBlocks
          .filter((block) => keepVisible(block.id))
          .find((block) => !block.complete);
        if (nextMissionBlock) {
          activeBlocks.push(nextMissionBlock);
        }
      }
    }
  }

  if (currentDay >= SUPPLY_DEPOT_UNLOCK_DAY && !hasSmallStorage) {
    if (keepVisible(sol10StorageBlock.id)) {
      activeBlocks.push(sol10StorageBlock);
    }
  }

  return (
    <div className="pointer-events-none absolute right-4 top-78 z-20 w-70 space-y-2 max-h-[calc(100vh-19rem)] overflow-y-auto scrollbar-none">
      {activeBlocks.map((block) => (
        <section
          key={block.id}
          className="bg-[#270F00] p-3 rounded-2xl text-white transition-all duration-300 pointer-events-auto"
        >
          <h3 className="mb-2 text-sm font-semibold leading-tight text-black uppercase bg-white py-1.5 px-3 rounded-lg">
            {block.taskLabel}: {block.heading}
          </h3>
          {block.optionalNote && (
            <p
              className={`mt-1 pl-2 text-[10px] uppercase tracking-normal ${
                block.id === "task-6" && foodStockpileExpired
                  ? "text-amber-400"
                  : "text-neutral-400"
              }`}
            >
              {block.optionalNote}
            </p>
          )}
          <div className="space-y-1.5 mt-3 pl-2">
            {block.lines.map((line) => (
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
      ))}
    </div>
  );
}

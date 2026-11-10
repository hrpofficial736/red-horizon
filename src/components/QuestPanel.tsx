import { useGameStore } from "../store/useGameStore";

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
  placedModules: Array<{ id: string; hp: number }>,
  moduleId: string,
) => placedModules.some((module) => module.id === moduleId && module.hp > 0);

export function QuestPanel() {
  const currentDay = useGameStore((state) => state.currentDay);
  const placedModules = useGameStore((state) => state.placedModules);
  const researchedNodeIds = useGameStore((state) => state.researchedNodeIds);
  const isCommsEstablished = useGameStore((state) => state.isCommsEstablished);

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
  const task6Complete = hasResearchLab;
  const task7Complete = researchedNodeIds.length > 0;

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
        { text: "Build kitchen module", done: hasKitchen },
        { text: "Build greenhouse module", done: hasGreenhouse },
      ],
    },
    {
      id: "task-6",
      taskLabel: "TASK6",
      heading: "Research Foundation",
      complete: task6Complete,
      lines: [{ text: "Build research lab module", done: hasResearchLab }],
    },
    {
      id: "task-7",
      taskLabel: "TASK7",
      heading: "Science Progress",
      complete: task7Complete,
      lines: [
        {
          text: "Research at least one tech",
          done: task7Complete,
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
    task6Complete
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
      complete: hasRadar && hasUplink && isCommsEstablished,
      lines: [
        { text: "Build radar module", done: hasRadar },
        { text: "Build uplink module", done: hasUplink },
        {
          text: "Establish connection with Earth",
          done: isCommsEstablished,
        },
      ],
    };

    if (!optionalBlock.complete) blocks.push(optionalBlock);
    if (!friendlyBlock.complete) blocks.push(friendlyBlock);
  }

  return (
    <div className="pointer-events-none absolute right-4 top-52 z-20 w-70 space-y-2">
      {blocks.map((block) => {
        return (
          <section
            key={block.id}
            className="rounded-xl border border-neutral-800 bg-neutral-950/85 p-3 font-mono text-white shadow-2xl backdrop-blur"
          >
            <h3 className="mb-1 text-[13px] font-bold leading-tight text-orange-200">
              {block.taskLabel}: {block.heading}
            </h3>
            {block.optional && (
              <p
                className={`mb-2 text-[10px] uppercase tracking-wide ${
                  optionalTowerExpired && !hasRadiationTower
                    ? "text-amber-300"
                    : "text-neutral-400"
                }`}
              >
                {block.optionalNote}
              </p>
            )}
            <div className="space-y-1">
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
        );
      })}
    </div>
  );
}

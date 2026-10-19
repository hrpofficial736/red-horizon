import type { ReactNode } from "react";

interface OverlayLayoutProps {
  title: string;
  moduleType: string;
  onClose: () => void;
  children: ReactNode;
  moduleTabs?: Array<{
    id: string;
    label: string;
    onClick: () => void;
  }>;
  activeModuleId?: string;
}

export function OverlayLayout({
  title,
  moduleType,
  onClose,
  children,
  moduleTabs = [],
  activeModuleId,
}: OverlayLayoutProps) {
  const isProduction = moduleType.match("PRODUCTION");
  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      className={`absolute bottom-28 left-1/2 z-50 h-[65vh] w-[90vw] ${isProduction ? "max-w-6xl" : "max-w-4xl"} -translate-x-1/2 animate-in zoom-in-95 flex flex-col rounded-xl overflow-hidden bg-neutral-950/75 shadow-2xl backdrop-blur-md fade-in duration-150 pointer-events-auto`}
    >
      <div className="flex items-center justify-between border-b border-neutral-700 bg-neutral-900/50 px-5 py-2">
        <h2 className="font-mono text-md font-bold uppercase tracking-widest text-white">
          {isProduction ? "Production" : `${title}`}
        </h2>
        {moduleTabs.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg bg-neutral-950/0 p-1">
            {moduleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`rounded-full px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider transition ${
                  activeModuleId === tab.id
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="cursor-pointer rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-500 transition hover:text-white"
        >
          ✕ CLOSE
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
    </div>
  );
}

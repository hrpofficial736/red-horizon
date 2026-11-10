import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useGameStore, type SavedGame } from "../store/useGameStore";

interface SaveMenuProps {
  onClose: () => void;
}

export function SaveMenu({ onClose }: SaveMenuProps) {
  const getAvailableSaves = useGameStore((state) => state.getAvailableSaves);
  const loadGameSave = useGameStore((state) => state.loadGameSave);
  const deleteSavedGames = useGameStore((state) => state.deleteSavedGames);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const [showSaves, setShowSaves] = useState(false);
  const [saves, setSaves] = useState<SavedGame[]>(getAvailableSaves);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [confirmDays, setConfirmDays] = useState<number[] | null>(null);
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  const loadSave = (day: number) => {
    if (loadGameSave(day)) onClose();
  };

  const confirmDelete = () => {
    if (!confirmDays) return;
    deleteSavedGames(confirmDays);
    setConfirmDays(null);
    setSelectedDays([]);
    setSaves(getAvailableSaves());
  };

  const toggleDay = (day: number) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((selected) => selected !== day)
        : [...current, day],
    );
  };

  const allSelected = saves.length > 0 && selectedDays.length === saves.length;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 pointer-events-auto">
      <section className="w-full max-w-md rounded-xl border border-orange-500/40 bg-neutral-950/95 p-5 font-mono text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-orange-400">
              OUTPOST ALPHA
            </p>
            <h2 className="mt-1 text-lg font-bold uppercase tracking-widest">
              Mission Menu
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-white"
          >
            ESC
          </button>
        </div>

        {!showSaves ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-900/50"
            >
              <RotateCcw size={17} /> Resume
            </button>
            <button
              type="button"
              onClick={() => setShowSaves(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/50"
            >
              <CalendarDays size={17} /> Load Game
            </button>
            <button
              type="button"
              onClick={() => setConfirmNewGame(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/40"
            >
              <Trash2 size={17} /> New Game
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowSaves(false)}
              className="mb-3 flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-400">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelectedDays(allSelected ? [] : saves.map((save) => save.day))
                  }
                  className="accent-orange-500"
                />
                Select all
              </label>
              {selectedDays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmDays(selectedDays)}
                  className="flex items-center gap-1 rounded border border-red-500/40 px-2 py-1 text-[10px] font-bold uppercase text-red-300 hover:bg-red-950/50"
                >
                  <Trash2 size={12} /> Delete save
                </button>
              )}
            </div>
            {saves.length === 0 ? (
              <p className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-center text-xs text-neutral-500">
                No previous day saves are available yet.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {saves.map((save) => (
                  <div
                    key={save.day}
                    className="relative flex w-full items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-left hover:border-orange-500/60 hover:bg-orange-950/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(save.day)}
                      onChange={() => toggleDay(save.day)}
                      className="accent-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => loadSave(save.day)}
                      className="flex min-w-0 flex-1 items-center justify-between py-1 text-left"
                    >
                      <span className="font-bold text-orange-300">
                        Sol {String(save.day).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Day start · {new Date(save.savedAt).toLocaleTimeString()}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      {confirmDays && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-lg border border-red-500/40 bg-neutral-950 p-4 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-300">
              Delete save{confirmDays.length > 1 ? "s" : ""}
            </h3>
            <p className="mt-2 text-xs text-neutral-300">
              Delete {confirmDays.length > 1 ? "the selected day saves" : `the Sol ${confirmDays[0]} save`}?
              This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDays(null)}
                className="rounded border border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex items-center gap-1 rounded bg-red-700 px-3 py-2 text-[10px] font-bold uppercase text-white hover:bg-red-600"
              >
                <Check size={12} /> Confirm delete
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmNewGame && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-lg border border-red-500/40 bg-neutral-950 p-4 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-300">
              Start new game
            </h3>
            <p className="mt-2 text-xs text-neutral-300">
              Start from Sol 1? All saves from the current game will be
              permanently deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmNewGame(false)}
                className="rounded border border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="rounded bg-red-700 px-3 py-2 text-[10px] font-bold uppercase text-white hover:bg-red-600"
              >
                Start new game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import {
  Check,
  Circle,
  Radio,
  Send,
  ShieldAlert,
  Signal,
  Sparkles,
} from "lucide-react";
import { OverlayLayout } from "./OverlayLayout";
import {
  EARTH_REPLY_DELAY_MINUTES,
  useGameStore,
} from "../store/useGameStore";

interface UplinkComponentProps {
  onClose: () => void;
  hasRadar: boolean;
}

const TRANSMISSIONS = [
  {
    from: "ASTRONAUT // OMEGA",
    message:
      "Earth, this is Omega Base. Our landing was successful, but the return vehicle is non-operational. Requesting immediate assistance.",
  },
  {
    from: "MISSION CONTROL // EARTH",
    message:
      "Omega, we read you. A heavy storm front is forecast for Sol 29. Rescue mission ARES-7 is being mobilized. Hold position and conserve power.",
  },
  {
    from: "ASTRONAUT // OMEGA",
    message:
      "Understood, Earth. We will prepare the surface sample and transmit all telemetry. Confirm the extraction priority.",
  },
  {
    from: "MISSION CONTROL // EARTH",
    message:
      "Confirmed. Secure one regolith sample, assemble the beacon, and transmit your green-light status before Sol 24.",
  },
];

const MILESTONES = [
  { id: "sample", label: "Surface sample secured · 1 QUANTITY" },
  { id: "beacon", label: "Rescue beacon blueprint placed" },
];

export function UplinkComponent({ onClose, hasRadar }: UplinkComponentProps) {
  const startUplinkConnection = useGameStore(
    (state) => state.startUplinkConnection,
  );
  const sendEarthReport = useGameStore((state) => state.sendEarthReport);
  const sendNextTransmission = useGameStore(
    (state) => state.sendNextTransmission,
  );
  const initializeRescueMission = useGameStore(
    (state) => state.initializeRescueMission,
  );
  const isCommsEstablished = useGameStore((state) => state.isCommsEstablished);
  const uplinkConnectionStartedAt = useGameStore(
    (state) => state.uplinkConnectionStartedAt,
  );
  const earthReportSent = useGameStore((state) => state.earthReportSent);
  const stormAlertReceived = useGameStore(
    (state) => state.stormAlertReceived,
  );
  const uplinkTransmissionIndex = useGameStore(
    (state) => state.uplinkTransmissionIndex,
  );
  const earthReplyPendingAt = useGameStore(
    (state) => state.earthReplyPendingAt,
  );
  const rescueMissionInitialized = useGameStore(
    (state) => state.rescueMissionInitialized,
  );
  const inventory = useGameStore((state) => state.inventory);
  const placedModules = useGameStore((state) => state.placedModules);
  const currentDay = useGameStore((state) => state.currentDay);
  const currentHour = useGameStore((state) => state.currentHour);
  const currentMinute = useGameStore((state) => state.currentMinute);

  const currentGameMinutes =
    (currentDay * 24 + currentHour) * 60 + currentMinute;
  const connectionStartedMinutes = uplinkConnectionStartedAt ?? 0;
  const elapsedConnectionMinutes =
    currentGameMinutes - connectionStartedMinutes;
  const isConnected =
    isCommsEstablished ||
    (uplinkConnectionStartedAt !== null && elapsedConnectionMinutes >= 30);
  const calculatedProgress =
    isConnected || isCommsEstablished
      ? 100
      : uplinkConnectionStartedAt !== null
        ? Math.min(99, Math.max(0, (elapsedConnectionMinutes / 30) * 100))
        : 0;
  const hasSample = (inventory.mars_sample ?? 0) >= 1;
  const hasBeacon = placedModules.some(
    (module) =>
      module.id === "beacon" &&
      module.hp > 0 &&
      (module.constructionHoursRemaining ?? 0) <= 0,
  );
  const displayedTransmissionIndex = uplinkTransmissionIndex;
  const replyPending = earthReplyPendingAt !== null;
  const replyMinutesRemaining = replyPending
    ? Math.max(0, Math.ceil(earthReplyPendingAt - currentGameMinutes))
    : 0;
  const establishConnection = () => {
    startUplinkConnection();
  };

  const advanceTransmission = () => {
    if (uplinkTransmissionIndex < 0) {
      sendEarthReport();
      return;
    }
    sendNextTransmission();
  };

  const startRescue = () => {
    initializeRescueMission();
  };

  return (
    <OverlayLayout
      title="MISSION CONTROL UPLINK"
      moduleType="TERMINAL"
      onClose={onClose}
    >
      <div className="flex h-full min-h-0 flex-col gap-3 font-mono text-white">
        <div className="flex items-center justify-between border border-cyan-500/30 bg-cyan-950/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2 text-cyan-300">
            <Radio size={14} /> Deep-space communications array
          </span>
          <span className={isConnected ? "text-emerald-300" : "text-amber-300"}>
            SOL 18 // RESCUE WINDOW SOL 24
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,0.8fr)_minmax(360px,1.4fr)]">
          <section className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-xl border border-neutral-800 bg-black/45 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-neutral-500">
                  UPLINK STATUS
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  {isConnected ? "EARTH ONLINE" : "AWAITING HANDSHAKE"}
                </h3>
              </div>
              <Signal
                size={24}
                className={isConnected ? "text-emerald-400" : "text-neutral-600"}
              />
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3">
              <div className="mb-2 flex justify-between text-[10px] uppercase text-neutral-400">
                <span>Signal handshake</span>
                <span>{Math.round(calculatedProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    isConnected ? "bg-emerald-400" : "bg-cyan-400"
                  }`}
                  style={{ width: `${calculatedProgress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={establishConnection}
              disabled={!hasRadar || isConnected || uplinkConnectionStartedAt !== null}
              className={`rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
                isConnected
                  ? "cursor-default border border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                  : hasRadar
                    ? "bg-cyan-400 text-black hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
                    : "cursor-not-allowed bg-neutral-800 text-neutral-500"
              }`}
            >
              {isConnected
                ? "✓ CONNECTION ESTABLISHED // ONLINE"
                : uplinkConnectionStartedAt !== null
                  ? "CALIBRATING ARRAY..."
                  : "ESTABLISH CONNECTION WITH EARTH"}
            </button>

            {!hasRadar && (
              <div className="flex gap-2 border border-amber-500/30 bg-amber-950/20 p-3 text-[10px] leading-relaxed text-amber-200">
                <ShieldAlert size={15} className="shrink-0 text-amber-400" />
                <span>
                  COMMS RADAR REQUIRED. Build and power a radar array before
                  opening an Earth connection.
                </span>
              </div>
            )}

            <div className="mt-auto border-t border-neutral-800 pt-3">
              <p className="mb-2 text-[10px] tracking-[0.2em] text-neutral-500">
                RESCUE READINESS
              </p>
              <div className="space-y-2">
                {MILESTONES.map((milestone) => {
                  const complete =
                    milestone.id === "sample" ? hasSample : hasBeacon;
                  return (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-2 text-[11px] text-neutral-300"
                    >
                    {complete ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Circle size={14} className="text-neutral-600" />
                    )}
                    {milestone.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-xl border border-neutral-800 bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-neutral-500">
                  SECURE CHANNEL // ARES-7
                </p>
                <h3 className="mt-1 text-sm font-bold uppercase">
                  Earth communication log
                </h3>
              </div>
              <span className="text-[10px] text-cyan-300">
                {isConnected ? "LIVE" : "OFFLINE"}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {displayedTransmissionIndex < 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-neutral-500">
                  <Radio size={28} />
                  <p className="max-w-xs text-xs leading-relaxed">
                    Establish the uplink to send the first Omega status report
                    to Mission Control.
                  </p>
                </div>
              )}
              {TRANSMISSIONS.slice(0, displayedTransmissionIndex + 1).map(
                (transmission, index) => (
                  <div
                    key={transmission.message}
                    className={`rounded-lg border p-3 ${
                      transmission.from.startsWith("EARTH")
                        ? "border-cyan-500/30 bg-cyan-950/20"
                        : "border-orange-500/30 bg-orange-950/20"
                    }`}
                  >
                    <div className="mb-1 flex justify-between text-[9px] tracking-wider text-neutral-500">
                      <span>{transmission.from}</span>
                      <span>TX {String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-200">
                      {transmission.message}
                    </p>
                  </div>
                ),
              )}
            </div>

            <button
              type="button"
              disabled={
                !isConnected ||
                replyPending ||
                displayedTransmissionIndex >= TRANSMISSIONS.length - 1
              }
              onClick={advanceTransmission}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} />
              {displayedTransmissionIndex < 0
                ? "SEND OMEGA REPORT"
                : replyPending
                  ? `AWAITING EARTH RESPONSE // ${replyMinutesRemaining} MIN`
                  : "NEXT TRANSMISSION"}
            </button>
            {replyPending && (
              <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-amber-300">
                Earth response expected after {EARTH_REPLY_DELAY_MINUTES} in-game
                minutes.
              </p>
            )}
          </section>
        </div>

        {isConnected && earthReportSent && stormAlertReceived && (
          <button
            type="button"
            disabled={!hasSample || !hasBeacon || rescueMissionInitialized}
            onClick={startRescue}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] transition ${
              rescueMissionInitialized
                ? "bg-emerald-500/20 text-emerald-300"
                : hasSample && hasBeacon
                  ? "animate-pulse bg-orange-400 text-black hover:bg-orange-300"
                  : "cursor-not-allowed bg-neutral-800 text-neutral-500"
            }`}
          >
            <Sparkles size={14} />
            {rescueMissionInitialized
              ? "RESCUE MISSION ARES-7 INITIALIZED"
              : "INITIALIZE RESCUE MISSION"}
          </button>
        )}
      </div>
    </OverlayLayout>
  );
}

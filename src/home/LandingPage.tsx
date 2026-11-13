
export default function LandingPage({ onStart }: { onStart: () => void }) {

    return (
        <main className="relative min-h-screen min-h-[100svh] w-full overflow-hidden bg-[#170d09] text-white flex flex-col justify-between">
            {/* Mars Background */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-105 animate-[zoomIn_2s_ease-out_forwards]"
                style={{
                    backgroundImage: "url('src/assets/images/mars-landing-bg.jpg')",
                }}
            />
            {/* Cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#100907]/95 via-[#190d08]/70 to-transparent" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#100907]/80 via-transparent to-black/20" />

            <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.65)] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20">

                <div className="flex items-center gap-3">
                    <span className="text-orange-400 text-3xl">◈</span>

                    <span className="font-[Orbitron] text-sm md:text-lg font-bold tracking-[0.3em]">
                        THE RED HORIZON
                    </span>
                </div>

                
            </header>

            {/* Main content */}
            <section className="relative z-10 w-[90%] max-w-[650px] ml-[6%] md:ml-[9%] py-12 animate-[fadeUp_1.2s_ease-out]">

                {/* Mission label */}
                <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-[0.25em] text-orange-300">
                    <span className="w-8 h-px bg-orange-400" />
                    OUTPOST ALPHA 
                    <span className="w-8 h-px bg-orange-400" />
                </div>

                {/* Game title */}
                <h1 className="flex flex-col mt-8 mb-3 font-[Orbitron] text-5xl sm:text-6xl md:text-7xl lg:text-[86px] font-medium leading-[1.08] tracking-wider drop-shadow-2xl">
                    <span>RED</span>

                    <span className="font-extrabold text-orange-400">
                        HORIZON
                    </span>
                </h1>

                <p className="text-orange-100/80 text-sm md:text-lg tracking-[0.3em] font-semibold">
                    SURVIVE THE STORM. BRING THE SAMPLE HOME.
                </p>

                {/* Divider */}
                <div className="w-20 h-[3px] bg-orange-400 mt-7 mb-7" />

                {/* Description */}
                <p className="max-w-[510px] text-base md:text-lg leading-relaxed tracking-wide text-stone-200/90">
                    Stranded on the red planet, humanity's future rests
                    in your hands. Build a self-sustaining outpost,
                    harness the resources of Mars, and complete a mission
                    that will change everything.
                </p>

                {/* Start button */}
                <button
                    onClick={onStart}
                    type="button"
                    className="group mt-10 flex min-w-[170px] items-center justify-between gap-8 border border-orange-400 bg-[#160d09]/80 px-6 py-4 font-[Orbitron] text-md font-bold tracking-widest text-orange-300 transition-all duration-300 hover:-translate-y-1 hover:bg-orange-500 hover:text-[#160d09] hover:shadow-[0_0_30px_rgba(233,133,71,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                >
                    <span>PLAY</span>

                    <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                        →
                    </span>
                </button>

                

            </section>

            {/* Footer */}
            <footer className="relative z-10 flex items-center justify-between border-t border-white/10 px-6 py-5 md:px-12 lg:px-20 text-[9px] md:text-[11px] tracking-[0.2em] text-stone-400">

                <span>RED HORIZON</span>

                

                <span>© 2026</span>
            </footer>

            {/* Animations */}
            <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes zoomIn {
          from {
            transform: scale(1.08);
          }
          to {
            transform: scale(1.05);
          }
        }
      `}</style>

        </main>
    );
}

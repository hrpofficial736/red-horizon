import { useState } from "react";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";

interface GuideBookProps {
  images: string[];
  onBack: () => void;
  onStartGame: () => void;
}

const GuideBook = ({ images, onBack, onStartGame }: GuideBookProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const isLastPage = currentPage === images.length - 1;

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPage((prev) => Math.min(images.length - 1, prev + 1));
    }
  };

  if (!images.length) return null;

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col border border-black">
      {/* Header */}
      <header className="relative flex items-center justify-center px-6 py-6">
        <button
          onClick={onBack}
          className="absolute left-6 top-1/2 -translate-y-1/2
            hover:opacity-50 transition-opacity"
          aria-label="Go back"
        >
          <ArrowLeft size={23} strokeWidth={2.5} />
        </button>

        <h1 className="text-2xl font-semibold tracking-tight">Game Guide</h1>
      </header>

      {/* Guide Image */}
      <main className="flex-1 flex items-center justify-center px-6 pb-4">
        <div className="w-full max-h-[calc(100vh-180px)] aspect-3/2 overflow-hidden">
          <img
            key={images[currentPage]}
            src={images[currentPage]}
            alt={`Game guide page ${currentPage + 1}`}
            className="w-full h-full object-contain animate-in fade-in duration-300"
          />
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="flex items-center justify-between px-6 sm:px-12 py-3">
        {/* Previous */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className="w-14 h-12 flex items-center justify-center
            bg-neutral-800 text-white rounded-xl
            hover:bg-neutral-900 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ArrowLeft size={23} strokeWidth={2.5} />
        </button>

        {/* Page Counter */}
        <span className="text-base font-semibold tabular-nums">
          {currentPage + 1}/{images.length}
        </span>

        {/* Next / Start Game */}
        {isLastPage ? (
          <button
            onClick={onStartGame}
            className="h-12 px-5 flex items-center justify-center gap-2 
            bg-neutral-800 text-white rounded-xl
            hover:bg-neutral-900 transition-colors
            cursor-pointer font-semibold text-sm"
          >
            Start Game
            <Play size={17} fill="white" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-14 h-12 flex items-center justify-center
              bg-neutral-800 text-white rounded-xl
              hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ArrowRight size={23} strokeWidth={2.5} />
          </button>
        )}
      </footer>
    </div>
  );
};

export default GuideBook;

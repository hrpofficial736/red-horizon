import { useEffect, useRef, useState } from "react";
import { Play, Pause, ArrowLeft, SkipForward } from "lucide-react";
import mars_video from "../assets/mars_final.mp4";

interface CutScenesProps {
  onBack: () => void;
  onSkip: () => void;
}

export const CutScenes = ({ onBack, onSkip }: CutScenesProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Autoplay when component mounts
  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, []);

  // Toggle play / pause
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Handle video completion
  const handleVideoEnd = () => {
    setIsPlaying(false);
    onSkip();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={mars_video}
        autoPlay
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlayback}
        className="absolute inset-0 h-full w-full object-cover cursor-pointer"
      />

      {/* Top Overlay Buttons */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg bg-black/40 px-4 py-2 text-white backdrop-blur-md hover:bg-black/60 transition"
        >
          <ArrowLeft size={18} />
          BACK
        </button>

        <button
          onClick={onSkip}
          className="flex items-center gap-2 rounded-lg bg-black/40 px-4 py-2 text-white backdrop-blur-md hover:bg-black/60 transition"
        >
          SKIP
          <SkipForward size={18} />
        </button>
      </div>

      {/* Center Play Button - Only visible when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlayback}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-white"
          aria-label="Play video"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-black/50 backdrop-blur-md transition hover:scale-110 hover:bg-black/70">
            <Play size={32} fill="white" />
          </div>
        </button>
      )}
    </div>
  );
};

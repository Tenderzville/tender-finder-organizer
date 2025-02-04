import { useState } from "react";
import { Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoWatchCardProps {
  adsWatched: number;
  onVideoWatched: () => Promise<void>;
}

export const VideoWatchCard = ({ adsWatched, onVideoWatched }: VideoWatchCardProps) => {
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

  const handleVideoWatch = async () => {
    setIsWatchingVideo(true);
    try {
      await onVideoWatched();
    } finally {
      setIsWatchingVideo(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span>Videos Watched</span>
        <span>{adsWatched}</span>
      </div>
      <Button 
        onClick={handleVideoWatch} 
        className="w-full"
        disabled={isWatchingVideo}
      >
        {isWatchingVideo ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Watching Video...
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Watch Video (+100 points)
          </>
        )}
      </Button>
    </div>
  );
};
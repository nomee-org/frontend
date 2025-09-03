import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
}

export function VoiceMessagePlayer({
  audioUrl,
  duration,
  className = "",
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayback = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      setIsLoading(true);
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setTotalDuration(audioRef.current.duration);
          setIsLoading(false);
        }
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      audioRef.current.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
      };
      
      audioRef.current.src = audioUrl;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `voice-message-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-3 p-3 bg-muted/50 rounded-lg max-w-xs ${className}`}>
      <Button
        onClick={togglePlayback}
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Voice message</span>
          <span className="text-xs font-mono tabular-nums">
            {formatTime(isPlaying ? currentTime : totalDuration)}
          </span>
        </div>
        
        {totalDuration > 0 && (
          <div className="w-full bg-background rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-100"
              style={{
                width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
              }}
            />
          </div>
        )}
      </div>
      
      {!isMobile && (
        <Button
          onClick={handleDownload}
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
        >
          <Download className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export function VoiceRecorder({
  onVoiceRecorded,
  onCancel,
  maxDuration = 300, // 5 minutes default
  onRecordingStateChange,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecordedBlob(blob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange?.(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStateChange?.(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (!recordedBlob) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audioUrl = URL.createObjectURL(recordedBlob);
    audioRef.current.src = audioUrl;

    audioRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      URL.revokeObjectURL(audioUrl);
    };

    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    audioRef.current.play();
    setIsPlaying(true);
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setRecordedBlob(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const sendVoiceNote = () => {
    if (recordedBlob) {
      onVoiceRecorded(recordedBlob, duration);
      deleteRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
        </div>

        <div className="flex-1 text-center">
          <span className="text-lg font-mono tabular-nums">
            {formatTime(duration)}
          </span>
          {maxDuration && (
            <span className="text-sm text-muted-foreground ml-2">
              / {formatTime(maxDuration)}
            </span>
          )}
        </div>

        <Button
          onClick={stopRecording}
          variant="destructive"
          size={isMobile ? "icon" : "sm"}
          className={isMobile ? "h-10 w-10" : ""}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (recordedBlob) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-card border border-border rounded-lg">
        <Button
          onClick={playRecording}
          variant="outline"
          size={isMobile ? "icon" : "sm"}
          className={isMobile ? "h-10 w-10" : ""}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Voice note</span>
            <span className="text-sm font-mono tabular-nums">
              {formatTime(isPlaying ? currentTime : duration)}
            </span>
          </div>
          {isPlaying && (
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-100"
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={deleteRecording}
            variant="outline"
            size={isMobile ? "icon" : "sm"}
            className={isMobile ? "h-10 w-10" : ""}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={sendVoiceNote}
            size={isMobile ? "icon" : "sm"}
            className={isMobile ? "h-10 w-10" : ""}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={startRecording}
      variant="outline"
      size={isMobile ? "icon" : "sm"}
      className={isMobile ? "h-10 w-10" : ""}
    >
      <Mic className="h-4 w-4" />
      {!isMobile && <span className="ml-1">Record</span>}
    </Button>
  );
}

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";

interface VoiceRecorderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number;
  embedded?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export function VoiceRecorderPopup({
  isOpen,
  onClose,
  onVoiceRecorded,
  maxDuration = 300,
  embedded = false,
  onRecordingStateChange,
}: VoiceRecorderPopupProps) {
  const isMobile = useIsMobile();

  const handleVoiceRecorded = (audioBlob: Blob, duration: number) => {
    onVoiceRecorded(audioBlob, duration);
    onClose();
  };

  const content = (
    <div className="space-y-4">
      {!embedded && (
        <div className="text-center">
          <h3 className="text-lg font-semibold">Voice Message</h3>
          <p className="text-sm text-muted-foreground">
            Record a voice message to send
          </p>
        </div>
      )}
      
      <div className="flex justify-center">
        <VoiceRecorder
          onVoiceRecorded={handleVoiceRecorded}
          onCancel={onClose}
          maxDuration={maxDuration}
          onRecordingStateChange={onRecordingStateChange}
        />
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader className="pb-4">
            <DrawerTitle className="sr-only">Voice Recorder</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Voice Recorder</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export const PWAInstallPrompt: React.FC = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setVisible(false);
      setPrompt(null);
      setInstalling(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!prompt) return;

    prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalling(true);
      toast.success("Installing..");
    } else {
      console.log("User dismissed the install prompt");
    }

    setPrompt(null);
    setVisible(false);
  };

  if (installed) return null;
  if (!visible) return null;

  return (
    <Dialog open={visible} onOpenChange={() => setVisible(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-grotesk">
            Install this app?
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enjoy using Nomee as a Stanlone App.
          </p>
        </DialogHeader>
        <div className="flex flex-col overflow-hidden">
          <div className="flex space-x-3 sticky bottom-0 bg-background pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setVisible(false)}
              className="flex-1"
              disabled={installing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex-1"
            >
              {installing ? (
                "Installing..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

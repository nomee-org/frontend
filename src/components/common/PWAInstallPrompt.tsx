import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useXmtp } from "@/contexts/XmtpContext";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export const PWAInstallPrompt: React.FC = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const isMobile = useIsMobile();
  const { identifier } = useXmtp();

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
    } else {
      setInstalling(false);
      toast.error("Installation cancelled.");
    }

    setPrompt(null);
    setVisible(false);
  };

  const content = (
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
  );

  if (installed) return null;
  if (!visible) return null;
  if (!identifier) return null;

  if (isMobile) {
    return (
      <Drawer open={visible} onOpenChange={() => setVisible(false)}>
        <DrawerContent className="max-h-[80vh] flex flex-col">
          <DrawerHeader className="sticky top-0 bg-background border-b">
            <DrawerTitle className="text-xl font-bold font-grotesk">
              Install this app?
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Enjoy using Nomee as a Stanlone App.
            </p>
          </DrawerHeader>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
        <div className="flex flex-col overflow-hidden">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

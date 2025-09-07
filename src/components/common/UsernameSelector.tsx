import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { useUsername } from "@/contexts/UsernameContext";
import { Loader, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function UsernameSelector() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isSwitching, activeUsername, setActiveUsername, availableNames } =
    useUsername();

  const handleSelect = (username: string) => {
    setActiveUsername(username);
    setOpen(false);
  };

  const trigger = (
    <Button
      variant="ghost"
      className="h-8 p-1 sm:w-32 lg:w-44 sm:h-8 lg:h-10 sm:p-2 justify-start"
      disabled={isSwitching}
    >
      <div className="flex items-center justify-start w-full">
        {isSwitching ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <DomainAvatar domain={activeUsername || ""} size="xs" />
        )}
        <span className="hidden sm:inline sm:ml-2 text-caption truncate">
          {activeUsername}
        </span>
        <ChevronDown className="h-4 w-4 ml-1" />
      </div>
    </Button>
  );

  const content = (
    <div className="space-y-2">
      {availableNames?.map((domain) => (
        <Button
          key={domain}
          variant={domain === activeUsername ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleSelect(domain)}
        >
          <div className="flex items-center space-x-2">
            <DomainAvatar domain={domain} size="xs" />
            <span className="text-sm">{domain}</span>
          </div>
        </Button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Username</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Username</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

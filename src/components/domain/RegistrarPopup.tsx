import { ExternalLink, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface RegistrarPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const registrars = [
  {
    name: "D3 Registrar",
    url: "https://testnet.d3.app/",
    description: "Official Identify Service for Web3",
    icon: "🏛️",
  },
];

export function RegistrarPopup({ isOpen, onClose }: RegistrarPopupProps) {
  const isMobile = useIsMobile();

  const handleRegistrarClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  const content = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a registrar to purchase domains
      </p>

      <div className="space-y-3">
        {registrars.map((registrar) => (
          <Card key={registrar.name} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{registrar.icon}</div>
                <div>
                  <h3 className="font-semibold">{registrar.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {registrar.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleRegistrarClick(registrar.url)}
                className="shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Buy Domain</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-safe">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Domain</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

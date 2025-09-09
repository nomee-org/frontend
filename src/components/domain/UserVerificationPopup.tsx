import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Shield,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRequestVerification } from "@/data/use-backend";
import { useUsername } from "@/contexts/UsernameContext";
import { toast } from "sonner";

interface UserVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isVerified?: boolean;
}

export function UserVerificationPopup({
  isOpen,
  onClose,
  isVerified = false,
}: UserVerificationPopupProps) {
  const isMobile = useIsMobile();
  const { activeUsername } = useUsername();
  const [isProcessing, setIsProcessing] = useState(false);

  const verificationMutation = useRequestVerification(activeUsername);

  const benefits = [
    {
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: "Less Ads",
      description: "Enjoy a cleaner experience with reduced advertising",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: "Better Visibility",
      description: "Your content gets higher priority and wider reach",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      title: "Engagement Analytics",
      description: "Access detailed insights about your content performance",
    },
  ];

  const handleVerification = async () => {
    try {
      if (isVerified) return;

      setIsProcessing(true);

      await verificationMutation.mutateAsync();

      onClose();
    } catch (error) {
      toast.error(error?.message || "Verification request failed");
    } finally {
      window.open("https://x.com/nomee_social", "_blank");
      setIsProcessing(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold font-grotesk">Get Verified</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock premium features and boost your domain presence
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm">Benefits you'll get:</h4>
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">{benefit.icon}</div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Verification Cost:</span>
          <div className="text-right">
            <div className="text-2xl font-bold font-grotesk text-primary">
              0 USDC
            </div>
            <div className="text-xs text-muted-foreground">
              and follow us on X
            </div>
          </div>
        </div>

        <Button
          onClick={handleVerification}
          disabled={isVerified || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : isVerified ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Already Verified
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Get Verified for Free
            </>
          )}
        </Button>

        {isVerified && (
          <div className="mt-3 text-center">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verification Active
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="px-4 pb-4">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="sr-only">User Verification</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">User Verification</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

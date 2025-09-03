import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useState } from "react";
import { RegistrarPopup } from "./RegistrarPopup";

interface BuyDomainProps {
  title?: string;
  description: string;
}

export function BuyDomain({
  title = "Buy Your Domain",
  description,
}: BuyDomainProps) {
  const [showRegistrarPopup, setShowRegistrarPopup] = useState(false);

  return (
    <>
      <div className="max-w-7xl mx-auto p-content space-content flex flex-col items-center justify-center min-h-[60vh] space-y-4 md:space-y-6">
        <div className="flex flex-col items-center space-y-3 md:space-y-4 text-center">
          <div className="p-3 md:p-4 rounded-full bg-muted">
            <Globe className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold font-grotesk">
              {title}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md text-sm md:text-base">
              {description}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRegistrarPopup(true)}
            className="text-xs md:text-sm"
          >
            <span className="hidden sm:inline">Buy Domain</span>
            <span className="sm:hidden">Buy</span>
          </Button>
        </div>
      </div>

      <RegistrarPopup
        isOpen={showRegistrarPopup}
        onClose={() => setShowRegistrarPopup(false)}
      />
    </>
  );
}
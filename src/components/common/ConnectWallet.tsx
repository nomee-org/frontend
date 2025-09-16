import { Button } from "@/components/ui/button";
import { Loader, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { modal } from "@/configs/reown";
import { useHelper } from "@/hooks/use-helper";

interface ConnectWalletProps {
  title?: string;
  description: string;
}

export function ConnectWallet({
  title = "Connect Your Wallet",
  description,
}: ConnectWalletProps) {
  const { address, isConnecting, isReconnecting } = useAccount();
  const { trimAddress } = useHelper();

  return (
    <div className="max-w-7xl w-full mx-auto p-content space-content flex flex-col items-center justify-center min-h-[60vh] space-y-4 md:space-y-6">
      <div className="flex flex-col items-center space-y-3 md:space-y-4 text-center">
        <div className="p-3 md:p-4 rounded-full bg-muted">
          <Wallet className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg md:text-2xl font-bold font-grotesk">
            {isConnecting || isReconnecting ? "Connecting to Wallet" : title}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm md:text-base">
            {description}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isConnecting || isReconnecting}
          onClick={() => modal.open()}
          className="text-xs md:text-sm"
        >
          {(isConnecting || isReconnecting) && (
            <Loader className="animate-spin" />
          )}
          <span className="hidden sm:inline">
            {address ? trimAddress(address, 5) : "Connect Wallet"}
          </span>
          <span className="sm:hidden">
            {address ? trimAddress(address, 4) : "Connect"}
          </span>
        </Button>
      </div>
    </div>
  );
}

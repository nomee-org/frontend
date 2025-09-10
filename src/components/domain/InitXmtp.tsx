import { Button } from "@/components/ui/button";
import { useXmtp } from "@/contexts/XmtpContext";
import { Inbox, Loader } from "lucide-react";

interface InitXmtpProps {
  description: string;
}

export function InitXmtp({ description }: InitXmtpProps) {
  const { connect, isLoading } = useXmtp();

  return (
    <>
      <div className="max-w-7xl mx-auto p-content space-content flex flex-col items-center justify-center min-h-[60vh] space-y-4 md:space-y-6">
        <div className="flex flex-col items-center space-y-3 md:space-y-4 text-center">
          <div className="p-3 md:p-4 rounded-full bg-muted">
            <Inbox className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold font-grotesk">
              <a href="https://xmtp.org/" target="_blank" className="underline">
                XMTP
              </a>{" "}
              is required.
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md text-sm md:text-base">
              {description}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={connect}
            disabled={isLoading}
            className="text-xs md:text-sm"
          >
            {isLoading && <Loader className="animate-spin" />}
            <span> Confirm</span>
          </Button>
        </div>
      </div>
    </>
  );
}

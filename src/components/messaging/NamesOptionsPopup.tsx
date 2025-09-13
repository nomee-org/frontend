import { ChevronRight, InboxIcon, Coins, Loader } from "lucide-react";
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
import { Conversation } from "@xmtp/browser-sdk";
import { Name } from "@/types/doma";
import { DomainAvatar } from "../domain/DomainAvatar";
import { formatUnits } from "viem";
import { useHelper } from "@/hooks/use-helper";

interface NameOptionsPopupProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: (deep: boolean) => void;
  names: Name[];
  handleClick: (name: Name) => void;
}

export function NameOptionsPopup({
  conversation,
  isOpen,
  onClose,
  names,
  handleClick,
}: NameOptionsPopupProps) {
  const isMobile = useIsMobile();
  const { formatLargeNumber } = useHelper();

  const content = (
    <>
      {names.length > 0 ? (
        <div className="space-y-3">
          {names.map((name) => (
            <Card
              key={name.name}
              onClick={() => handleClick(name)}
              className="p-4 cursor-pointer hover:bg-secondary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DomainAvatar domain={name.name} size="sm" />
                  <div>
                    <h3 className="font-semibold">{name.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {name?.tokens?.[0]?.chain?.name && (
                        <>{`${name?.tokens?.[0]?.chain?.name} • `}</>
                      )}
                      {name?.tokens?.[0]?.listings?.length ? (
                        <>
                          {formatLargeNumber(
                            Number(
                              formatUnits(
                                BigInt(name?.tokens?.[0]?.listings?.[0].price),
                                name?.tokens?.[0]?.listings?.[0].currency
                                  .decimals
                              )
                            )
                          )}{" "}
                          {name?.tokens?.[0]?.listings?.[0].currency.symbol}
                        </>
                      ) : (
                        "Not listed"
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="px-4 py-10">
          <p className="text-muted text-sm text-center">
            User has no domain name.
          </p>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={() => onClose(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Choose a domain</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Select a domain to continue
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
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a domain</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select a domain to continue
          </p>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

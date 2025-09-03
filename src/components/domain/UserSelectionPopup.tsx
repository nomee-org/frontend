import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, Users, X, Check } from "lucide-react";
import { DomainAvatar } from "@/components/domain/DomainAvatar";
import { QueryLoader } from "@/components/ui/query-loader";
import { QueryError } from "@/components/ui/query-error";
import { useNames } from "@/data/use-doma";

interface UserSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
}

export default function UserSelectionPopup({
  isOpen,
  onClose,
  domainName,
}: UserSelectionPopupProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const {
    data: namesData,
    isLoading,
    error,
    refetch,
  } = useNames(50, false, searchQuery, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedUsers(new Set());
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleUserToggle = (username: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(username)) {
        newSet.delete(username);
      } else {
        newSet.add(username);
      }
      return newSet;
    });
  };

  const handleAddToWatchlist = () => {
    // TODO: Implement API call to add selected users to watchlist
    console.log("Adding users to watchlist:", Array.from(selectedUsers));
    onClose();
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Add to Watchlist</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Domain Info */}
      <div className="px-4 py-3 bg-muted/50">
        <div className="flex items-center space-x-3">
          <DomainAvatar domain={domainName} size="sm" className="w-8 h-8" />
          <div>
            <p className="font-medium text-sm">{domainName}</p>
            <p className="text-xs text-muted-foreground">
              Select users to add this domain to their watchlist
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="p-4">
            <QueryError error={error} onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <QueryLoader />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {(namesData?.pages?.[0]?.totalCount ?? 0) > 0 ? (
                namesData?.pages
                  ?.flatMap((p) => p.items)
                  ?.map((user) => (
                    <div
                      key={user.name}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleUserToggle(user.name)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <DomainAvatar
                          domain={user.name}
                          size="sm"
                          className="w-10 h-10"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm truncate">
                              {user.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedUsers.has(user.name) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center text-sm text-muted-foreground p-4">
                  {searchQuery
                    ? "No users found"
                    : "Start typing to search users"}
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      {selectedUsers.size > 0 && (
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {selectedUsers.size} selected
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddToWatchlist}>
                Add to Watchlist
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[90vh]">{content}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] p-0">
        {content}
      </DialogContent>
    </Dialog>
  );
}

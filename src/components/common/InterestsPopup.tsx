import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader, Check, X, Sparkles } from "lucide-react";
import {
  useGetInterestSuggestions,
  useUpdateInterests,
} from "@/data/use-backend";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useUsername } from "@/hooks/use-username";

interface InterestsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CheckableBadgeProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckableBadge: React.FC<CheckableBadgeProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <Badge
      variant={checked ? "default" : "outline"}
      className={cn(
        "cursor-pointer transition-all duration-200 select-none hover:scale-105 relative overflow-hidden",
        "border-2 px-4 py-2 text-sm font-medium",
        checked
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-background text-foreground border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {checked && <Check className="w-3 h-3" />}
      </div>
    </Badge>
  );
};

export const InterestsPopup: React.FC<InterestsPopupProps> = ({
  open,
  onOpenChange,
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { activeUsername, profile } = useUsername();

  const { data: interestSuggestions, isLoading: suggestionsLoading } =
    useGetInterestSuggestions();
  const updateInterestsMutation = useUpdateInterests();

  useEffect(() => {
    setSelectedInterests(profile?.interests ?? []);
  }, [profile]);

  const handleInterestToggle = (interest: string, checked: boolean) => {
    setSelectedInterests((prev) =>
      checked ? [...prev, interest] : prev.filter((i) => i !== interest)
    );
  };

  const handleSave = async () => {
    try {
      if (!activeUsername) {
        return toast({
          title: "No active user",
          variant: "destructive",
        });
      }
      await updateInterestsMutation.mutateAsync({
        interests: selectedInterests,
      });
      toast({
        title: "Interests updated!",
        description: "Your feed will now show more relevant content.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to update interests",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const scrollableContent = (
    <div className="space-y-6 py-4">
      {suggestionsLoading ? (
        <div className="flex justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Categories */}
          {interestSuggestions?.categories &&
            interestSuggestions.categories.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interestSuggestions.categories.map((category) => (
                    <CheckableBadge
                      key={category.toLowerCase()}
                      label={category}
                      checked={selectedInterests.includes(
                        category.toLowerCase()
                      )}
                      onChange={(checked) =>
                        handleInterestToggle(category.toLowerCase(), checked)
                      }
                      disabled={updateInterestsMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Hashtags */}
          {interestSuggestions?.popularHashtags &&
            interestSuggestions.popularHashtags.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  Popular Hashtags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interestSuggestions.popularHashtags.map((hashtag) => (
                    <CheckableBadge
                      key={hashtag}
                      label={`#${hashtag}`}
                      checked={selectedInterests.includes(hashtag)}
                      onChange={(checked) =>
                        handleInterestToggle(hashtag, checked)
                      }
                      disabled={updateInterestsMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

          {!interestSuggestions?.categories?.length &&
            !interestSuggestions?.popularHashtags?.length && (
              <div className="text-center p-8 text-muted-foreground">
                <p>No interest suggestions available at the moment.</p>
              </div>
            )}
        </>
      )}
    </div>
  );

  const actionButtons = (
    <div className="flex gap-3 pt-4 border-t bg-background">
      <Button
        variant="outline"
        onClick={handleSkip}
        disabled={updateInterestsMutation.isPending}
        className="flex-1"
      >
        Skip for now
      </Button>
      <Button
        onClick={handleSave}
        disabled={
          updateInterestsMutation.isPending || selectedInterests.length === 0
        }
        className="flex-1"
      >
        {updateInterestsMutation.isPending ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Save Interests ({selectedInterests.length})
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="space-y-3 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
              <DrawerTitle className="text-xl font-bold">
                Customize Your Feed
              </DrawerTitle>
            </div>
            <DrawerDescription className="text-base text-center">
              Select topics you're interested in to personalize your timeline
              and discover relevant content.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 flex-1 overflow-y-auto min-h-0">
            {scrollableContent}
          </div>
          <div className="px-4 pb-4 flex-shrink-0">{actionButtons}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="space-y-3 p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl font-bold">
              Customize Your Feed
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Select topics you're interested in to personalize your timeline and
            discover relevant content.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 flex-1 overflow-y-auto min-h-0">
          {scrollableContent}
        </div>
        <div className="px-6 pb-6 flex-shrink-0">{actionButtons}</div>
      </DialogContent>
    </Dialog>
  );
};

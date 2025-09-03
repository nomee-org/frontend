import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, X } from "lucide-react";
import { ISponsoredAd, AdInteractionType } from "@/types/backend";
import { useRecordAdInteraction } from "@/data/use-backend";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SponsoredAdProps {
  ad: ISponsoredAd;
  onDismiss?: (adId: string) => void;
}

export const SponsoredAd = ({ ad, onDismiss }: SponsoredAdProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const recordInteraction = useRecordAdInteraction();

  // Track impressions using Intersection Observer
  useEffect(() => {
    if (!adRef.current || hasRecordedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasRecordedImpression) {
            recordInteraction.mutate({
              adId: ad.id,
              dto: { type: AdInteractionType.IMPRESSION },
            });
            setHasRecordedImpression(true);
          }
        });
      },
      {
        threshold: 0.5, // Ad must be 50% visible
        rootMargin: "0px",
      }
    );

    observer.observe(adRef.current);

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [ad.id, hasRecordedImpression, recordInteraction]);

  const handleClick = () => {
    recordInteraction.mutate({
      adId: ad.id,
      dto: { type: AdInteractionType.CLICK },
    });

    // Open the target URL in a new tab
    if (ad.targetUrl) {
      window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordInteraction.mutate({
      adId: ad.id,
      dto: { type: AdInteractionType.DISMISS },
    });
    setIsDismissed(true);
    onDismiss?.(ad.id);
    toast.success("Ad dismissed");
  };

  if (isDismissed) return null;

  return (
    <Card
      ref={adRef}
      className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 shadow-custom-md hover:shadow-custom-lg transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      {/* Sponsored badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge
          variant="secondary"
          className="text-xs font-medium bg-muted/80 text-muted-foreground border border-border/50"
        >
          Sponsored
        </Badge>
      </div>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-3 right-3 z-10 h-6 w-6 p-0 opacity-60 hover:opacity-100 bg-background/80 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="p-4 pt-8">
        {/* Media section */}
        {(ad.imageUrl || ad.videoUrl) && (
          <div className="mb-4 rounded-lg overflow-hidden bg-muted/30">
            {ad.videoUrl ? (
              <video
                src={ad.videoUrl}
                className="w-full h-48 object-cover"
                controls={false}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : ad.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
        )}

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-heading text-foreground font-semibold group-hover:text-accent transition-colors">
              {ad.title}
            </h3>
            <p className="text-body text-muted-foreground mt-1 line-clamp-2">
              {ad.description}
            </p>
          </div>

          {/* CTA section */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-blue-light hover:bg-gradient-blue-dark text-white border-0 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {ad.ctaText}
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>

            <div className="text-xs text-muted-foreground">
              {ad.impressions.toLocaleString()} views
            </div>
          </div>
        </div>
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};

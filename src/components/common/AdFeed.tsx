import { SponsoredAd } from "@/components/common/SponsoredAd";
import { IPost, ISponsoredAd } from "@/types/backend";
import { useState, useEffect } from "react";

interface AdFeedProps {
  posts: IPost[];
  ads: ISponsoredAd[];
  adFrequency?: number; // Show ad every N posts
  children: (
    items: (IPost | { type: "ad"; ad: ISponsoredAd })[],
    dismissedAds: Set<string>
  ) => React.ReactNode;
}

export const AdFeed = ({
  posts,
  ads,
  adFrequency = 10,
  children,
}: AdFeedProps) => {
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());

  const handleAdDismiss = (adId: string) => {
    setDismissedAds((prev) => new Set(prev).add(adId));
  };

  // Merge posts and ads based on frequency
  const mergePostsWithAds = (): (
    | IPost
    | { type: "ad"; ad: ISponsoredAd }
  )[] => {
    const result: (IPost | { type: "ad"; ad: ISponsoredAd })[] = [];
    const availableAds = ads.filter(
      (ad) => ad.isActive && !dismissedAds.has(ad.id)
    );
    let adIndex = 0;

    posts.forEach((post, index) => {
      result.push(post);

      // Insert ad after every adFrequency posts
      if ((index + 1) % adFrequency === 0 && adIndex < availableAds.length) {
        result.push({
          type: "ad" as const,
          ad: availableAds[adIndex],
        });
        adIndex++;
      }
    });

    return result;
  };

  const items = mergePostsWithAds();

  return <>{children(items, dismissedAds)}</>;
};

// Helper component for rendering individual items
export const AdFeedItem = ({
  item,
  onAdDismiss,
  renderPost,
}: {
  item: IPost | { type: "ad"; ad: ISponsoredAd };
  onAdDismiss?: (adId: string) => void;
  renderPost: (post: IPost) => React.ReactNode;
}) => {
  if ("type" in item && item.type === "ad") {
    return (
      <div className="my-6">
        <SponsoredAd ad={item.ad} onDismiss={onAdDismiss} />
      </div>
    );
  }

  return renderPost(item as IPost);
};

import { SEO } from "./SEO";

interface FeedSEOProps {
  feedType: "timeline" | "trending";
  activeUsername?: string;
  postsCount?: number;
}

export function FeedSEO({
  feedType,
  activeUsername,
  postsCount = 0
}: FeedSEOProps) {
  const isTrending = feedType === "trending";
  
  const title = isTrending 
    ? "Trending Posts - Discover Popular Content"
    : activeUsername 
      ? `${activeUsername}'s Timeline - Personal Feed`
      : "Community Timeline - Latest Posts";

  const description = isTrending
    ? `Discover the most popular and trending posts in the Nomee community. Join conversations about blockchain domains, web3, and digital identity. ${postsCount} trending posts available.`
    : activeUsername
      ? `${activeUsername}'s personalized timeline on Nomee. Stay updated with posts from users you follow in the blockchain domain community. ${postsCount} posts in feed.`
      : `Join the Nomee community timeline. Discover the latest posts about blockchain domains, NFT domains, and web3 identity. Connect with domain enthusiasts worldwide.`;

  const keywords = isTrending
    ? "trending posts, popular content, viral posts, blockchain domains, web3 community, domain trading discussions"
    : activeUsername
      ? `${activeUsername}, personal timeline, social feed, blockchain domains, web3 social, domain community`
      : "community timeline, blockchain domains, NFT domains, web3 social, domain trading, digital identity";

  const url = isTrending 
    ? `${window.location.origin}/?tab=trending`
    : `${window.location.origin}/`;

  // Structured data for social media platform
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nomee Community",
    "description": description,
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": isTrending ? "Trending Posts" : "Community Timeline",
      "description": description,
      "numberOfItems": postsCount
    }
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      url={url}
      type="website"
      structuredData={structuredData}
    />
  );
}
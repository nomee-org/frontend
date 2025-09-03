import { SEO } from "./SEO";

interface HashtagSEOProps {
  hashtag: string;
  postsCount: number;
  usageCount?: number;
}

export function HashtagSEO({ hashtag, postsCount, usageCount }: HashtagSEOProps) {
  const displayCount = usageCount || postsCount;
  
  const title = `#${hashtag} - ${displayCount.toLocaleString()} Posts | Nomee`;
  
  const description = `Discover ${displayCount.toLocaleString()} posts about #${hashtag} on Nomee. Join the conversation and explore trending topics in the decentralized social network for domain owners.`;

  const keywords = `${hashtag}, hashtag, social media, posts, trending, decentralized, domain names, blockchain, web3, community, discussion, ${hashtag} posts`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `#${hashtag}`,
    description: description,
    url: `${window.location.origin}/hashtag/${hashtag}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: displayCount,
      itemListElement: Array.from({ length: Math.min(displayCount, 10) }, (_, i) => ({
        "@type": "SocialMediaPosting",
        position: i + 1,
        about: `#${hashtag}`,
        url: `${window.location.origin}/hashtag/${hashtag}#post-${i + 1}`,
      })),
    },
    about: {
      "@type": "Thing",
      name: `#${hashtag}`,
      description: `Discussion topic about ${hashtag}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: window.location.origin,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Hashtags",
          item: `${window.location.origin}/search?type=hashtags`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `#${hashtag}`,
          item: `${window.location.origin}/hashtag/${hashtag}`,
        },
      ],
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Nomee",
      url: window.location.origin,
    },
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      structuredData={structuredData}
      type="website"
    />
  );
}
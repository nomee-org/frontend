import { SEO } from "./SEO";

interface SearchSEOProps {
  searchQuery?: string;
  activeTab: "users" | "posts";
  usersCount?: number;
  postsCount?: number;
}

export function SearchSEO({
  searchQuery,
  activeTab,
  usersCount = 0,
  postsCount = 0
}: SearchSEOProps) {
  const isSearching = Boolean(searchQuery);
  
  const title = isSearching
    ? `Search Results for "${searchQuery}" - ${activeTab === "users" ? "Users" : "Posts"}`
    : `Discover ${activeTab === "users" ? "Users" : "Posts"} - Browse Community`;

  const description = isSearching
    ? `Find ${activeTab === "users" ? "domain owners and users" : "posts and discussions"} related to "${searchQuery}" on Nomee. ${activeTab === "users" ? usersCount : postsCount} ${activeTab} found in blockchain domain community.`
    : `Discover ${activeTab === "users" ? "domain owners, traders, and community members" : "trending posts and discussions"} in the Nomee blockchain domain community. Connect with like-minded individuals in web3.`;

  const keywords = isSearching
    ? `${searchQuery}, search results, ${activeTab === "users" ? "domain owners, blockchain users" : "posts, discussions"}, web3 community, domain trading`
    : `discover ${activeTab}, blockchain community, domain owners, web3 social, NFT domains, domain trading community`;

  const searchUrl = `${window.location.origin}/search${isSearching ? `?q=${encodeURIComponent(searchQuery)}` : ''}`;

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": isSearching ? "SearchResultsPage" : "WebPage",
    "name": title,
    "description": description,
    "url": searchUrl,
    ...(isSearching && {
      "mainEntity": {
        "@type": "ItemList",
        "name": `Search Results for "${searchQuery}"`,
        "numberOfItems": activeTab === "users" ? usersCount : postsCount,
        "itemListElement": []
      }
    }),
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      url={searchUrl}
      type="website"
      structuredData={structuredData}
    />
  );
}
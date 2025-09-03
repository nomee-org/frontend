import { SEO } from "./SEO";

interface DomainSearchSEOProps {
  searchQuery?: string;
  category?: string;
  sortBy?: string;
  listedOnly?: boolean;
  domainsCount?: number;
}

export function DomainSearchSEO({
  searchQuery,
  category = "all",
  sortBy = "popularity",
  listedOnly = true,
  domainsCount = 0
}: DomainSearchSEOProps) {
  const isSearching = Boolean(searchQuery);
  const categoryText = category === "all" ? "All Domains" : `.${category} Domains`;
  
  const title = isSearching
    ? `${searchQuery} Domain Search Results - ${categoryText}`
    : `Discover Premium Domains - ${categoryText} Marketplace`;

  const description = isSearching
    ? `Find ${searchQuery} blockchain domains for sale. Browse ${domainsCount} ${categoryText.toLowerCase()} ${listedOnly ? "listed for sale" : "available"} on Nomee marketplace. Buy, sell, and trade premium web3 domains.`
    : `Discover premium blockchain domains in our marketplace. Browse ${categoryText.toLowerCase()} ${listedOnly ? "for sale" : "available"} on Nomee. Find your perfect NFT domain for web3 identity and investment.`;

  const keywords = [
    isSearching ? `${searchQuery} domains` : "premium domains",
    "blockchain domains for sale",
    "NFT domains marketplace", 
    "buy domains",
    "domain trading",
    "web3 domains",
    ...(category !== "all" ? [`${category} domains`] : []),
    "domain investment",
    "digital identity domains"
  ].join(", ");

  const searchUrl = `${window.location.origin}/discover${isSearching ? `?q=${encodeURIComponent(searchQuery)}` : ''}`;

  // Structured data for marketplace
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": searchUrl,
    "mainEntity": {
      "@type": "ItemList",
      "name": isSearching ? `${searchQuery} Domain Search Results` : "Domain Marketplace",
      "description": description,
      "numberOfItems": domainsCount
    },
    "provider": {
      "@type": "Organization",
      "name": "Nomee",
      "url": window.location.origin
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "ETH",
      "availability": "https://schema.org/InStock",
      "offerCount": domainsCount
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
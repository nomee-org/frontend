import { SEO } from "./SEO";

interface NotFoundSEOProps {
  requestedPath?: string;
}

export function NotFoundSEO({ requestedPath }: NotFoundSEOProps) {
  const title = "Page Not Found (404) - Nomee";
  const description = `The page you're looking for doesn't exist on Nomee${requestedPath ? ` (${requestedPath})` : ''}. Return to our blockchain domain marketplace to discover premium domains, trade NFT domains, and connect with the web3 community.`;

  const keywords = "404 error, page not found, blockchain domains, NFT domains, domain marketplace, web3 platform";

  const notFoundUrl = `${window.location.origin}${requestedPath || '/404'}`;

  // Structured data for 404 page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": notFoundUrl,
    "mainEntity": {
      "@type": "Thing",
      "name": "404 Error Page",
      "description": "Page not found error"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "404 - Page Not Found"
        }
      ]
    }
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      url={notFoundUrl}
      type="website"
      structuredData={structuredData}
    />
  );
}
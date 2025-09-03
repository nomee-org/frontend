import { SEO } from "./SEO";

interface PortfolioSEOProps {
  domainsCount?: number;
  totalValue?: number;
  isConnected?: boolean;
}

export function PortfolioSEO({
  domainsCount = 0,
  totalValue = 0,
  isConnected = false
}: PortfolioSEOProps) {
  const title = isConnected 
    ? `My Domain Portfolio - ${domainsCount} Domains Worth ${totalValue} ETH`
    : "Domain Portfolio - Track Your Blockchain Domain Investments";

  const description = isConnected
    ? `Manage your ${domainsCount} blockchain domains worth ${totalValue} ETH. Track domain performance, monitor watchlist, and analyze your web3 domain investment portfolio on Nomee.`
    : "Connect your wallet to view and manage your blockchain domain portfolio. Track domain values, monitor performance, and manage your web3 domain investments on Nomee marketplace.";

  const keywords = [
    "domain portfolio",
    "blockchain domain tracking",
    "NFT domain management",
    "domain investment tracker",
    "web3 portfolio",
    "domain performance analytics",
    "crypto domain wallet",
    "domain asset management"
  ].join(", ");

  const portfolioUrl = `${window.location.origin}/portfolio`;

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Domain Portfolio Manager",
    "description": description,
    "url": portfolioUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "provider": {
      "@type": "Organization",
      "name": "Nomee",
      "url": window.location.origin
    },
    ...(isConnected && {
      "mainEntity": {
        "@type": "Collection",
        "name": "User Domain Portfolio",
        "description": `Portfolio of ${domainsCount} blockchain domains`,
        "size": domainsCount,
        "value": {
          "@type": "MonetaryAmount",
          "currency": "ETH",
          "value": totalValue
        }
      }
    })
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      url={portfolioUrl}
      type="website"
      structuredData={structuredData}
    />
  );
}
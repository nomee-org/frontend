import { SEO } from "./SEO";
import { Name } from "@/types/doma";

interface DomainSEOProps {
  domain: Name;
  isListed?: boolean;
  currentPrice?: string;
  currency?: string;
  postsCount?: number;
  followersCount?: number;
}

export function DomainSEO({
  domain,
  isListed = false,
  currentPrice,
  currency,
  postsCount = 0,
  followersCount = 0
}: DomainSEOProps) {
  const domainName = domain.name;
  const isForSale = isListed && currentPrice;
  
  let description = `${domainName} - Premium blockchain domain on Nomee. `;
  
  if (isForSale) {
    description += `Currently listed for ${currentPrice} ${currency}. `;
  }
  
  description += `${followersCount} followers, ${postsCount} posts. `;
  description += `${domain.transferLock ? 'Non-transferable' : 'Transferable'} domain.`;
  
  const title = isForSale 
    ? `${domainName} - ${currentPrice} ${currency}`
    : `${domainName} - Blockchain Domain`;

  const keywords = [
    domainName,
    "blockchain domain",
    "NFT domain", 
    "domain trading",
    "web3 domain",
    ...(isForSale ? ["domain for sale", "buy domain", currentPrice] : []),
    ...(domain.transferLock ? ["non-transferable"] : ["transferable"]),
  ].filter(Boolean).join(", ");

  const domainUrl = `${window.location.origin}/names/${domainName}`;

  // Structured data for domain/product
  const structuredData = {
    "@context": "https://schema.org",
    "@type": isForSale ? "Product" : "Thing",
    "name": domainName,
    "description": description,
    "url": domainUrl,
    "identifier": domainName,
    "category": "Blockchain Domain",
    ...(isForSale && {
      "offers": {
        "@type": "Offer",
        "price": currentPrice,
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
        "url": domainUrl,
        "seller": {
          "@type": "Organization",
          "name": "Nomee"
        }
      }
    }),
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Transferable",
        "value": domain.transferLock ? "No" : "Yes"
      },
      {
        "@type": "PropertyValue", 
        "name": "Followers",
        "value": followersCount
      },
      {
        "@type": "PropertyValue",
        "name": "Posts",
        "value": postsCount
      }
    ]
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      url={domainUrl}
      type={isForSale ? "product" : "website"}
      structuredData={structuredData}
    />
  );
}
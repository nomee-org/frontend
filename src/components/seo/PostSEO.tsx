import { SEO } from "./SEO";

interface PostSEOProps {
  postId: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  mediaUrls?: string[];
}

export function PostSEO({
  postId,
  title,
  content,
  authorName,
  createdAt,
  likesCount,
  commentsCount,
  mediaUrls = []
}: PostSEOProps) {
  // Clean content for description (remove HTML tags, limit length)
  const cleanContent = content.replace(/<[^>]*>/g, '').substring(0, 160);
  const description = `${cleanContent} - Post by ${authorName} on Nomee. ${likesCount} likes, ${commentsCount} comments.`;
  
  const postUrl = `${window.location.origin}/feeds/${postId}`;
  const postTitle = title || `Post by ${authorName}`;
  
  // Use first media image as og:image if available
  const ogImage = mediaUrls.length > 0 ? mediaUrls[0] : undefined;

  // Structured data for blog post
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": postTitle,
    "description": cleanContent,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": `${window.location.origin}/names/${authorName}`
    },
    "datePublished": createdAt,
    "url": postUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nomee",
      "url": window.location.origin
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": likesCount
      },
      {
        "@type": "InteractionCounter", 
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": commentsCount
      }
    ],
    ...(mediaUrls.length > 0 && {
      "image": mediaUrls.map(url => ({
        "@type": "ImageObject",
        "url": url
      }))
    })
  };

  return (
    <SEO
      title={postTitle}
      description={description}
      keywords={`${authorName}, social media post, blockchain domains, community feed, domain discussion`}
      url={postUrl}
      type="article"
      image={ogImage}
      structuredData={structuredData}
    />
  );
}
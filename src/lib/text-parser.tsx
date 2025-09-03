/* eslint-disable react-refresh/only-export-components */
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface ParsedTextProps {
  text: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function ParsedText({ text, onClick, className }: ParsedTextProps) {
  const parseTextToElements = (text: string): ReactNode[] => {
    if (!text) return [];

    // Regex to match hashtags and usernames
    const regex = /(#[a-zA-Z0-9_]+)|(@[a-zA-Z0-9._-]+)/g;

    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const matchedText = match[0];

      if (matchedText.startsWith("#")) {
        // Hashtag
        const hashtag = matchedText.slice(1);
        parts.push(
          <Link
            key={`hashtag-${match.index}`}
            to={`/hashtag/${hashtag}`}
            className="text-primary hover:text-primary/80 hover:underline font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(e);
            }}
          >
            {matchedText}
          </Link>
        );
      } else if (matchedText.startsWith("@")) {
        // Username mention
        const username = matchedText.slice(1);
        parts.push(
          <Link
            key={`mention-${match.index}`}
            to={`/names/${username}`}
            className="text-primary hover:text-primary/80 hover:underline font-medium bg-primary/10 px-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(e);
            }}
          >
            {matchedText}
          </Link>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const elements = parseTextToElements(text);

  return (
    <div className={className}>
      {elements.map((element, index) => (
        <span key={index}>{element}</span>
      ))}
    </div>
  );
}

// Utility function to strip HTML and parse plain text
export function parseContentToText(content: string): string {
  // Remove HTML tags
  return content.replace(/<[^>]*>/g, "");
}

// Function to check if content contains HTML
export function containsHTML(content: string): boolean {
  return /<[^>]*>/g.test(content);
}

// Function to make mentions clickable in HTML content
export function makeHtmlMentionsClickable(htmlContent: string): string {
  // Replace @mentions that are not already inside <a> tags
  return htmlContent.replace(
    /(?!<[^>]*>)@([a-zA-Z0-9._-]+)(?![^<]*<\/a>)/g,
    '<a href="/names/$1" class="text-accent hover:text-accent/80 hover:underline font-medium" onclick="event.stopPropagation()">@$1</a>'
  );
}

// Enhanced ParsedText component that handles both plain text and HTML
interface ParsedContentProps {
  content: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function ParsedContent({
  content,
  onClick,
  className,
}: ParsedContentProps) {
  if (containsHTML(content)) {
    const processedHTML = makeHtmlMentionsClickable(content);
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: processedHTML }}
        onClick={onClick}
      />
    );
  } else {
    return (
      <ParsedText text={content} onClick={onClick} className={className} />
    );
  }
}

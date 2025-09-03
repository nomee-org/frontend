import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateDomainBackground } from "@/lib/domain-background";
import domaIcon from "@/assets/doma.png";
interface DomainAvatarProps {
  domain: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function DomainAvatar({
  domain = "Unknown",
  size = "md",
  className,
}: DomainAvatarProps) {
  const sizeClasses = {
    xs: "h-5 w-5",
    sm: "h-8 w-8",
    md: "h-15 w-15",
    lg: "h-20 w-20",
  };

  const backgroundSvg = generateDomainBackground(domain);

  const compositeSvg = `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="square-clip">
          <rect x="0" y="0" width="60" height="60" rx="8"/>
        </clipPath>
      </defs>
      <!-- Background image -->
      <image href="${backgroundSvg}" x="0" y="0" width="60" height="60" clip-path="url(#square-clip)"/>
      <!-- Centered icon with subtle background -->
      <rect x="15" y="15" width="30" height="30" rx="4" fill="rgba(0,0,0,0.3)" />
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;base64,${btoa(compositeSvg)}`;

  return (
    <Avatar
      className={`${sizeClasses[size]} ${className} rounded-lg !shadow-none !border-none`}
    >
      <img
        src={domaIcon}
        className="absolute w-[40%] h-[40%] top-[29%] left-[29%]"
      />
      <AvatarImage src={dataUrl} alt={`${domain} profile`} />
      <AvatarFallback className="bg-muted text-muted-foreground rounded-lg">
        {domain.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

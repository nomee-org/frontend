import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  className?: string;
}

export function VerifiedBadge({ isVerified, className }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  return (
    <CheckCircle 
      className={cn("w-4 h-4 text-blue-500 fill-blue-500", className)} 
      aria-label="Verified user"
    />
  );
}
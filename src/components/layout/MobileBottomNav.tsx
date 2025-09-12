import { NavLink, useLocation } from "react-router-dom";
import {
  Search,
  MessageSquare,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import { useUsername } from "@/contexts/UsernameContext";
import { useXmtp } from "@/contexts/XmtpContext";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";

const navigationItems = [
  { title: "Messages", url: "/", icon: MessageSquare },
  { title: "Discover", url: "/discover", icon: Search },
  { title: "Feeds", url: "/feeds", icon: Users },
  { title: "Me", url: "/me", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { newMessage } = useXmtp();

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around py-2 px-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[3rem] ${
              isActive(item.url)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <div className="relative">
              <item.icon className="h-4 w-4" />
              {item.title === "Messages" &&
                newMessage &&
                !newMessage.contentType.sameAs(ContentTypeReadReceipt) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
            </div>
            <span className="text-caption mt-1 truncate">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

import { useLocation, NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  MessageSquare,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import { useUsername } from "@/contexts/UsernameContext";
import Nomee from "../common/Nomee";
import { useXmtp } from "@/contexts/XmtpContext";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";

const navigationItems = [
  { title: "Messages", url: "/", icon: MessageSquare },
  { title: "Discover", url: "/discover", icon: Search },
  { title: "Feeds", url: "/feeds", icon: Users },
  { title: "Me", url: "/me", icon: UserCircle },
];

const settingsItems = [{ title: "Settings", url: "/settings", icon: Settings }];

export function AppSidebar() {
  const { state } = useSidebar();
  const { client, newMessage } = useXmtp();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavClass = (path: string) =>
    isActive(path)
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="hidden md:flex">
        {/* Logo Section */}
        <div className="p-2 md:p-4 border-b border-sidebar-border">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            <Nomee />
            {!isCollapsed && (
              <span className="ml-2 text-xl font-bold font-grotesk">Nomee</span>
            )}
          </div>
        </div>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel
              className={`font-grotesk font-semibold ${
                isCollapsed ? "text-center" : "text-left"
              }`}
            >
              {isCollapsed ? "" : "Navigation"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={`h-10 ${
                            isCollapsed
                              ? "w-full justify-center"
                              : "justify-start"
                          }`}
                        >
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className={`${getNavClass(item.url)} ${
                              isCollapsed
                                ? "flex justify-center items-center w-full"
                                : "flex items-center justify-start"
                            }`}
                          >
                            <div
                              className={`relative ${
                                isCollapsed ? "flex justify-center" : ""
                              }`}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.title === "Messages" && newMessage && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                            </div>
                            {!isCollapsed && (
                              <span className="font-grotesk text-lg">
                                {item.title}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                          {item.title === "Messages" &&
                            newMessage &&
                            !newMessage.contentType.sameAs(
                              ContentTypeReadReceipt
                            ) &&
                            newMessage.senderInboxId !== client.inboxId && (
                              <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Settings Section */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={`h-10 ${
                            isCollapsed
                              ? "w-full justify-center"
                              : "justify-start"
                          }`}
                        >
                          <NavLink
                            to={item.url}
                            className={`${getNavClass(item.url)} ${
                              isCollapsed
                                ? "flex justify-center items-center w-full"
                                : "flex items-center justify-start"
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            {!isCollapsed && (
                              <span className="font-grotesk text-lg">
                                {item.title}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}

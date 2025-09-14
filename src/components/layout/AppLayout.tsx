import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/common/ThemeToggle";
import { NotificationPopover } from "@/components/common/NotificationPopover";
import { useTheme } from "@/components/common/ThemeProvider";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useHelper } from "@/hooks/use-helper";
import { modal } from "@/configs/reown";
import { useUsername } from "@/contexts/UsernameContext";
import { UsernameSelector } from "@/components/common/UsernameSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import Nomee from "../common/Nomee";

function AppLayoutContent() {
  const location = useLocation();
  const { theme } = useTheme();
  const { address, isConnecting, isReconnecting } = useAccount();
  const { trimAddress } = useHelper();
  const { activeUsername } = useUsername();
  const [sidebarDefaultOpen, setSidebarDefaultOpen] = useState(true);
  const isMobile = useIsMobile();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/discover") return "Discover";
    if (path === "/me") return "Me";
    if (path === "/feeds") return "Feeds";
    if (path === "/") return "Messages";
    if (path === "/settings") return "Settings";
    if (path === "/notifications") return "Notifications";
    if (path.startsWith("/names/")) return "";
    if (path.startsWith("/feeds/")) return "";
    return "";
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modal.setThemeMode(theme as any);
  }, [theme]);

  useEffect(() => {
    navigator.serviceWorker.register("/firebase-messaging-sw.js");
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setSidebarDefaultOpen(width >= 1024);
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-12 lg:h-16 sticky top-0 z-50 backdrop-blur-sm">
            <div className="flex items-center justify-between h-full px-4 py-2 lg:px-6 lg:py-3">
              <div className="flex items-center gap-2 md:gap-3">
                <SidebarTrigger className="hidden md:flex" />

                {isMobile ? (
                  <Nomee />
                ) : (
                  <h1 className="text-heading font-grotesk text-foreground truncate">
                    {getPageTitle()}
                  </h1>
                )}

                {location.pathname !== "/" &&
                  !location.pathname.startsWith("/messages") &&
                  !location.pathname.startsWith("/group") &&
                  activeUsername && <UsernameSelector />}
              </div>
              <div className="flex items-center gap-3 md:gap-2">
                <NotificationPopover />
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isConnecting || isReconnecting}
                  onClick={() => modal.open()}
                  className="text-caption h-8 lg:h-9"
                >
                  <span className="hidden sm:inline">
                    {address ? trimAddress(address) : "Connect Wallet"}
                  </span>
                  <span className="sm:hidden">
                    {address ? trimAddress(address) : "Connect"}
                  </span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 pb-16 md:pb-0`}>
            <div className={"max-w-[max(80rem,calc(100%-32px))] mx-auto"}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function AppLayout() {
  return <AppLayoutContent />;
}

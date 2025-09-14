import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { wagmiAdapter } from "./configs/reown";
import { AppRoutes } from "./Routes";
import { UsernameProvider } from "./contexts/UsernameContext";
import { XmtpProvider } from "./contexts/XmtpContext";
import { NameResolverProvider } from "./contexts/NicknameContext";
import { PWAInstallPrompt } from "./components/common/PWAInstallPrompt";
const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider storageKey="nomee-theme">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <UsernameProvider>
              <XmtpProvider>
                <NameResolverProvider>
                  <AppRoutes />
                  <PWAInstallPrompt />
                </NameResolverProvider>
              </XmtpProvider>
            </UsernameProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
};

export default App;

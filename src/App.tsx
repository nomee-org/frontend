import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import Messages from "./pages/Messages";
import UserConversation from "./components/messaging/UserConversation";
import GroupConversation from "./components/messaging/GroupConversation";
import DomainSearch from "./pages/DomainSearch";
import DomainDetails from "./pages/DomainDetails";
import Community from "./pages/Community";
import PostDetails from "./pages/PostDetails";
import Portfolio from "./pages/Portfolio";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import Hashtag from "./pages/Hashtag";
import { wagmiAdapter } from "./configs/reown";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nomee-theme">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Community />} />
                  <Route path="discover" element={<DomainSearch />} />
                  <Route path="search" element={<Search />} />
                  <Route path="feeds/:postId" element={<PostDetails />} />
                  <Route path="names/:domainName" element={<DomainDetails />} />
                  <Route path="hashtag/:hashtag" element={<Hashtag />} />
                  <Route path="portfolio" element={<Portfolio />} />
                  <Route path="messages" element={<Messages />}>
                    <Route path=":username" element={<UserConversation />} />
                    <Route path="groups/:id" element={<GroupConversation />} />
                  </Route>
                  <Route path="settings" element={<Settings />} />
                  <Route path="notifications" element={<Notifications />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
};

export default App;

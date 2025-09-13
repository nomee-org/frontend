import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { MobileBottomNav } from "./components/layout/MobileBottomNav";

export const AppRoutes = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="/" element={<Messages />}>
              <Route path="messages/:dmId" element={<UserConversation />} />
              <Route path="groups/:id" element={<GroupConversation />} />
            </Route>
            <Route path="feeds" element={<Community />} />
            <Route path="discover" element={<DomainSearch />} />
            <Route path="search" element={<Search />} />
            <Route path="feeds/:postId" element={<PostDetails />} />
            <Route path="names/:domainName" element={<DomainDetails />} />
            <Route path="hashtag/:hashtag" element={<Hashtag />} />
            <Route path="me" element={<Portfolio />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </>
  );
};

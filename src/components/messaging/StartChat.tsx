/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import { DomainAvatar } from "../domain/DomainAvatar";

export const StartChat = ({ dmId }: { dmId: string }) => {
  const navigate = useNavigate();

  const handleConversationClick = () => {
    navigate(`/messages/${dmId}`);
  };

  return (
    <div
      onClick={handleConversationClick}
      className={`mx-4 py-3 last:border-0 md:m-0 md:p-3 cursor-pointer transition-all duration-200 md:hover:bg-accent/80 border-t-sidebar-border border-b md:rounded-xl md:border md:border-transparent hover:shadow-sm`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative flex-shrink-0">
          <div className="relative">
            <DomainAvatar
              domain={dmId}
              className="h-12 w-12 ring-2 ring-background shadow-sm"
            />

            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-500 border-2 border-background rounded-full"></div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground max-w-40">
                {dmId}
              </h3>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <span className="text-xs text-muted-foreground font-medium">
                New chat
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground truncate flex-1 max-w-44">
              Start a conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

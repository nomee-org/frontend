import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useGetToken, useGetUserProfile } from "@/data/use-backend";
import { useOwnedNames } from "@/data/use-doma";
import { backendService } from "@/services/backend/backendservice";
import { webSocketService } from "@/services/backend/socketservice";
import { useAccount } from "wagmi";
import { AuthResponse, IUserProfile } from "@/types/backend";
import { toast } from "sonner";
interface UsernameContextType {
  token: AuthResponse;
  isSwitching: boolean;
  activeUsername: string | null;
  setActiveUsername: (name: string | null) => void;
  profile: IUserProfile;
  availableNames: string[] | undefined;
  refetchProfile: () => void;
}

const UsernameContext = createContext<UsernameContextType | undefined>(
  undefined
);

interface UsernameProviderProps {
  children: ReactNode;
}

export const UsernameProvider: React.FC<UsernameProviderProps> = ({
  children,
}) => {
  const { address } = useAccount();
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const { data: token } = useGetToken(activeUsername);

  const { data: namesData } = useOwnedNames(address, 10, []);
  const { data: profileData, refetch: refetchProfile } = useGetUserProfile();

  const _setActiveUsername = (newUsername: string) => {
    setIsSwitching(true);

    backendService.getToken(newUsername).then((token) => {
      if (token && token.accessToken && token.refreshToken) {
        backendService.setTokens(token.accessToken, token.refreshToken);

        refetchProfile();

        webSocketService.updateConfig({
          token: token.accessToken,
          username: activeUsername,
        });

        webSocketService.connect();
      }

      setActiveUsername(newUsername);
      setIsSwitching(false);
    });
  };

  useEffect(() => {
    if (activeUsername) {
      toast(`Connected to @${activeUsername}`);
    }
  }, [activeUsername]);

  useEffect(() => {
    const availableNames = namesData?.pages
      ?.flatMap((p) => p.items)
      ?.map((name) => name.name);

    if (availableNames?.length) {
      setActiveUsername(availableNames[0]);
    } else {
      setActiveUsername(null);
    }
  }, [namesData]);

  useEffect(() => {
    if (token && token.accessToken && token.refreshToken) {
      backendService.setTokens(token.accessToken, token.refreshToken);

      refetchProfile();

      webSocketService.updateConfig({
        token: token.accessToken,
        username: activeUsername,
      });

      webSocketService.connect();
    }
  }, [token]);

  const value = {
    token,
    isSwitching,
    activeUsername,
    setActiveUsername: _setActiveUsername,
    profile: profileData,
    availableNames:
      namesData?.pages?.flatMap((p) => p.items)?.map((name) => name.name) ?? [],
    refetchProfile,
  };

  return (
    <UsernameContext.Provider value={value}>
      {children}
    </UsernameContext.Provider>
  );
};

export const useUsername = (): UsernameContextType => {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    throw new Error("useUsername must be used within a UsernameProvider");
  }
  return context;
};

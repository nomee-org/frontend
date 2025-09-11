import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useXmtp } from "@/contexts/XmtpContext";
import { useHelper } from "@/hooks/use-helper";
import { useAccount } from "wagmi";

const STORAGE_KEY = import.meta.env.VITE_NOMEE_NICKNAMES;

type NameResolverContextType = {
  users: Record<string, string>;
  nickname: (address?: string, length?: number) => string;
  setNickname: (address: string, name: string) => void;
  clearNickname: (address: string) => void;
};

const NameResolverContext = createContext<NameResolverContextType | undefined>(
  undefined
);

export const NameResolverProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { client } = useXmtp();
  const { address: myAddress } = useAccount();
  const { trimAddress } = useHelper();

  const [users, setUsers] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      console.warn("Failed to parse stored nicknames");
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const nickname = useCallback(
    (address?: string, length?: number): string => {
      if (!address) return "Unknown";

      const lookUp = users[address.toLowerCase()];

      if (!lookUp && address?.toLowerCase() === myAddress?.toLowerCase()) {
        return "You";
      }

      return lookUp ?? (length ? trimAddress(address, length) : address);
    },
    [client?.inboxId, users, trimAddress]
  );

  const setNickname = useCallback((address: string, name: string) => {
    if (!address || !name) return;
    setUsers((prev) => ({
      ...prev,
      [address.toLowerCase()]: name,
    }));
  }, []);

  const clearNickname = useCallback((address: string) => {
    setUsers((prev) => {
      const { [address]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <NameResolverContext.Provider
      value={{ users, nickname, setNickname, clearNickname }}
    >
      {children}
    </NameResolverContext.Provider>
  );
};

export function useNameResolver() {
  const ctx = useContext(NameResolverContext);
  if (!ctx) {
    throw new Error(
      "useNameResolver must be used within a NameResolverProvider"
    );
  }
  return ctx;
}

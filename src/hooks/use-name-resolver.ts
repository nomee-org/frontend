import { useXmtp } from "@/contexts/XmtpContext";
import React from "react";

const STORAGE_KEY = import.meta.env.VITE_NOMEE_NICKNAMES;

export function useNameResolver() {
  const { client } = useXmtp();

  const [users, setUsers] = React.useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      console.warn("Failed to parse stored nicknames");
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const nickname = React.useCallback(
    (address?: string): string => {
      if (!address) return "Unkwown";
      if (address?.toLowerCase() === client?.inboxId?.toLowerCase())
        return "You";
      return users[address] ?? address;
    },
    [client?.inboxId, users]
  );

  const setNickname = React.useCallback((address: string, name: string) => {
    setUsers((prev) => ({
      ...prev,
      [address]: name,
    }));
  }, []);

  const clearNickname = React.useCallback((address: string) => {
    setUsers((prev) => {
      const { [address]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    users,
    nickname,
    setNickname,
    clearNickname,
  };
}

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
    (inboxId: string): string => {
      if (inboxId?.toLowerCase() === client?.inboxId?.toLowerCase())
        return "You";
      return users[inboxId] ?? inboxId;
    },
    [client?.inboxId, users]
  );

  const setNickname = React.useCallback((inboxId: string, name: string) => {
    setUsers((prev) => ({
      ...prev,
      [inboxId]: name,
    }));
  }, []);

  const clearNickname = React.useCallback((inboxId: string) => {
    setUsers((prev) => {
      const { [inboxId]: _, ...rest } = prev;
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

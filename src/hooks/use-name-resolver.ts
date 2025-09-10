import { useXmtp } from "@/contexts/XmtpContext";
import { useGetUsersByInboxIds } from "@/data/use-backend";
import { IUserBasic } from "@/types/backend";
import React, { useEffect } from "react";

export function useNameResolver() {
  const [inboxIds, setInboxIds] = React.useState<Set<string>>(new Set());
  const [users, setUsers] = React.useState<Record<string, IUserBasic>>({});

  const { data, refetch } = useGetUsersByInboxIds(Array.from(inboxIds));
  const { client } = useXmtp();

  useEffect(() => {
    console.log(data);

    if (!data) return;

    const map = data.reduce<Record<string, IUserBasic>>((acc, user) => {
      acc[user.inboxId] = user;
      return acc;
    }, {});

    setUsers((prev) => ({ ...prev, ...map }));
  }, [data]);

  const resolveUsername = (inboxId: string): string => {
    if (inboxId === client?.inboxId) return "You";
    return users[inboxId]?.username ?? inboxId;
  };

  const loadResolveableIds = (ids: string[] | string) => {
    console.log({ ids });

    setInboxIds((prev) => {
      const next = new Set(prev);
      if (Array.isArray(ids)) {
        ids.forEach((id) => next.add(id));
      } else {
        next.add(ids);
      }
      return next;
    });
    refetch();
  };

  return {
    loadResolveableIds,
    resolveUsername,
  };
}

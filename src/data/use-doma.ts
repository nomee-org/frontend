import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { dataService } from "@/services/doma/dataservice";

export const queryKeys = {
  default: ["names"] as const,
  all: (
    page: number,
    take: number,
    listed: boolean,
    tlds: string[],
    name: string
  ) => [...queryKeys.default, page, take, listed, tlds, name] as const,
  ownedNames: (page: number, take: number, owner: string, tlds: string[]) =>
    [...queryKeys.all(page, take, false, tlds, ""), owner] as const,
  watchedNames: (page: number, take: number, names: string[], tlds: string[]) =>
    [...queryKeys.all(page, take, false, tlds, ""), names] as const,
  single: (name: string) => [...queryKeys.default, name] as const,
  defaultOffers: ["offers"] as const,
  allOffers: (page: number, take: number, tokenId: string) =>
    [...queryKeys.defaultOffers, page, take, tokenId] as const,
};

export function useNames(
  take: number,
  listed: boolean,
  name: string,
  tlds: string[]
) {
  return useInfiniteQuery({
    queryKey: queryKeys.all(1, take, listed, tlds, name),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      dataService.getNames({ page: pageParam, take, listed, tlds, name }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.hasPreviousPage ? firstPage.currentPage - 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useOwnedNames(address: string, take: number, tlds: string[]) {
  return useInfiniteQuery({
    queryKey: queryKeys.ownedNames(1, take, address, tlds),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      dataService.getOwnedNames({ page: pageParam, take, address }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.hasPreviousPage ? firstPage.currentPage - 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useSelectedNames(
  names: string[],
  take: number,
  tlds: string[] | null
) {
  return useInfiniteQuery({
    queryKey: queryKeys.watchedNames(1, take, names, tlds),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      dataService.getWatchedNames({
        page: pageParam,
        take,
        name: names.join(""),
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.hasPreviousPage ? firstPage.currentPage - 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useName(name: string) {
  return useQuery({
    queryKey: queryKeys.single(name),
    queryFn: () => dataService.getName({ name }),
  });
}

export function useOffers(take: number, tokenId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.allOffers(1, take, tokenId),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      dataService.getOffers({ page: pageParam, take, tokenId }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.hasPreviousPage ? firstPage.currentPage - 1 : undefined;
    },

    initialPageParam: 1,
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { backendService } from "@/services/backend/backendservice";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  IUser,
  IUserProfile,
  IUserBasic,
  IPost,
  IComment,
  IHashtag,
  ISponsoredAd,
  IFollowSuggestion,
  AuthResponse,
  RefreshTokenDto,
  UploadProgress,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateCommentDto,
  UpdateProfileDto,
  DeleteAccountDto,
  UpdateInterestsDto,
  VotePollDto,
  FollowSuggestionFeedbackDto,
  CreateAdDto,
  UpdateAdDto,
  AdInteractionDto,
  StickerPack,
  Sticker,
} from "../types/backend";
import {
  Client,
  Conversation,
  DecodedMessage,
  Group,
  PermissionLevel,
} from "@xmtp/browser-sdk";

export const queryKeys = {
  auth: {
    token: (username: string | null) => ["auth", "token", username] as const,
  },
  users: {
    all: (activeUsername?: string) => ["users", activeUsername] as const,
    profile: (activeUsername?: string) =>
      ["users", "profile", activeUsername] as const,
    byUsername: (username: string, activeUsername?: string) =>
      ["users", username, activeUsername] as const,
    byInboxIds: (inboxIds: string[]) =>
      ["users", "byInboxIds", inboxIds] as const,
    followers: (
      username: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["users", username, "followers", page, limit, activeUsername] as const,
    following: (
      username: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["users", username, "following", page, limit, activeUsername] as const,
    followSuggestions: (activeUsername?: string) =>
      ["users", "suggestions", "follow", activeUsername] as const,
    interestSuggestions: ["users", "interests", "suggestions"] as const,
  },
  posts: {
    all: (
      page: number,
      limit: number,
      username?: string,
      activeUsername?: string
    ) =>
      [
        "posts",
        page,
        limit,
        ...(username ? [username] : []),
        activeUsername,
      ] as const,
    trending: (page: number, limit: number, activeUsername?: string) =>
      ["posts", "trending", page, limit, activeUsername] as const,
    byId: (postId: string, activeUsername?: string) =>
      ["posts", postId, activeUsername] as const,
    likes: (
      postId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["posts", postId, "likes", page, limit, activeUsername] as const,
    pollResults: (postId: string, activeUsername?: string) =>
      ["posts", postId, "poll", "results", activeUsername] as const,
    pollVoters: (
      postId: string,
      optionId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) =>
      [
        "posts",
        postId,
        "poll",
        "voters",
        optionId,
        page,
        limit,
        activeUsername,
      ] as const,
    reposts: (
      postId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["posts", postId, "reposts", page, limit, activeUsername] as const,
    progress: (postId: string) => ["posts", postId, "progress"] as const,
  },
  comments: {
    byPost: (
      postId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["comments", "post", postId, page, limit, activeUsername] as const,
    replies: (
      commentId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) =>
      ["comments", commentId, "replies", page, limit, activeUsername] as const,
    byId: (commentId: string) => ["comments", commentId] as const,
  },
  feeds: {
    timeline: (
      page: number,
      limit: number,
      username?: string,
      activeUsername?: string
    ) => ["feeds", "timeline", page, limit, username, activeUsername] as const,
  },
  hashtags: {
    trending: (limit: number, activeUsername?: string) =>
      ["hashtags", "trending", limit, activeUsername] as const,
    search: (query: string, limit: number, activeUsername?: string) =>
      ["hashtags", "search", query, limit, activeUsername] as const,
    posts: (
      tag: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["hashtags", tag, "posts", page, limit, activeUsername] as const,
  },
  search: {
    users: (query: string, limit: number, activeUsername?: string) =>
      ["search", "users", query, limit, activeUsername] as const,
    posts: (
      query: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) => ["search", "posts", query, page, limit, activeUsername] as const,
    hashtags: (query: string, limit: number, activeUsername?: string) =>
      ["search", "hashtags", query, limit, activeUsername] as const,
    autocomplete: (
      query: string,
      type: "users" | "hashtags",
      limit: number,
      activeUsername?: string
    ) =>
      ["search", "autocomplete", query, type, limit, activeUsername] as const,
  },
  notifications: {
    all: (
      page: number,
      limit: number,
      unreadOnly: boolean,
      activeUsername?: string
    ) => ["notifications", page, limit, unreadOnly, activeUsername] as const,
    unreadCount: (activeUsername?: string) =>
      ["notifications", "unreadCount", activeUsername] as const,
  },
  media: {
    uploadProgress: (uploadId: string, activeUsername?: string) =>
      ["media", "upload", uploadId, "progress"] as const,
    downloadUrl: (fileUrl: string, activeUsername?: string) =>
      ["media", "download", "url", fileUrl, activeUsername] as const,
    info: (fileUrl: string) => ["media", "info", "url", fileUrl] as const,
  },
  messages: {
    byConversation: (
      conversationId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) =>
      [
        "messages",
        "conversation",
        conversationId,
        page,
        limit,
        activeUsername,
      ] as const,
    search: (
      conversationId: string,
      query: string,
      limit: number,
      activeUsername?: string
    ) =>
      [
        "messages",
        "search",
        conversationId,
        query,
        limit,
        activeUsername,
      ] as const,
  },
  conversations: {
    all: (page: number, limit: number, activeUsername?: string) =>
      ["conversations", page, limit, activeUsername] as const,
    byId: (conversationId: string, activeUsername?: string) =>
      ["conversations", conversationId, activeUsername] as const,
    members: (
      conversationId: string,
      page: number,
      limit: number,
      activeUsername?: string
    ) =>
      [
        "conversations",
        conversationId,
        "members",
        page,
        limit,
        activeUsername,
      ] as const,
    unreadCount: (conversationId: string, activeUsername?: string) =>
      ["conversations", conversationId, "unreadCount", activeUsername] as const,
    lastOpenedCount: (lastOpenedAt: Date) =>
      ["conversations", "lastOpenedCount", lastOpenedAt] as const,
    pinnedMessages: (conversationId: string, activeUsername?: string) =>
      [
        "conversations",
        conversationId,
        "pinned-messages",
        activeUsername,
      ] as const,
  },
  stickers: {
    packs: (page: number, limit: number, activeUsername?: string) =>
      ["stickers", "packs", page, limit] as const,
    pack: (packId: string, activeUsername?: string) =>
      ["stickers", "pack", packId, activeUsername] as const,
    trending: (limit: number, activeUsername?: string) =>
      ["stickers", "trending", limit, activeUsername] as const,
    recent: (limit: number, activeUsername?: string) =>
      ["stickers", "recent", limit, activeUsername] as const,
  },
  ads: {
    feed: (
      context: "feed" | "stories" | "sidebar",
      limit: number,
      activeUsername?: string
    ) => ["ads", "feed", context, limit, activeUsername] as const,
    analytics: (adId: string, activeUsername?: string) =>
      ["ads", adId, "analytics", activeUsername] as const,
  },
  encryption: {
    keyPair: (activeUsername?: string) =>
      ["encryption", "keypair", activeUsername] as const,
  },
  analytics: {
    engagement: (activeUsername?: string) =>
      ["analytics", "engagement", activeUsername] as const,
    content: (postId: string, activeUsername?: string) =>
      ["analytics", "content", postId, activeUsername] as const,
  },
};

export function useGetToken(
  username: string | null,
  options?: UseQueryOptions<AuthResponse, Error>
) {
  return useQuery<AuthResponse, Error>({
    queryKey: queryKeys.auth.token(username),
    queryFn: () => backendService.getToken(username),
    ...options,
  });
}

export function useRefreshToken() {
  return useMutation<
    { accessToken: string; refreshToken: string },
    Error,
    RefreshTokenDto
  >({
    mutationFn: (dto) => backendService.refreshToken(dto),
  });
}

export function useLogout() {
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => backendService.logout(),
  });
}

export function useSetTokens(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { accessToken: string; refreshToken: string }
  >({
    mutationFn: ({ accessToken, refreshToken }) => {
      backendService.setTokens(accessToken, refreshToken);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useClearTokens(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => {
      backendService.clearTokens();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useGetUserProfile(
  options?: UseQueryOptions<IUserProfile, Error>
) {
  return useQuery<IUserProfile, Error>({
    queryKey: queryKeys.users.profile,
    queryFn: () => backendService.getUserProfile(),
    ...options,
  });
}

export function useUpdateProfile(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IUser, Error, UpdateProfileDto>({
    mutationFn: (dto) => backendService.updateProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; deletionDate: Date },
    Error,
    DeleteAccountDto
  >({
    mutationFn: (dto) => backendService.deleteAccount(dto),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useDeactivateAccount(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, DeleteAccountDto>({
    mutationFn: (dto) => backendService.deactivateAccount(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useReactivateAccount(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => backendService.reactivateAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useGetUserByUsername(
  username: string,
  options?: UseQueryOptions<IUserProfile, Error>,
  activeUsername?: string
) {
  return useQuery<IUserProfile, Error>({
    queryKey: queryKeys.users.byUsername(username, activeUsername),
    queryFn: () => backendService.getUserByUsername(username, activeUsername),
    ...options,
  });
}

export function useFollowUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (username) => backendService.followUser(username),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byUsername(username, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useUnfollowUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (username) => backendService.unfollowUser(username),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byUsername(username, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useBlockUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (username) => backendService.blockUser(username),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byUsername(username, activeUsername),
      });
    },
  });
}

export function useUnblockUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (username) => backendService.unblockUser(username),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byUsername(username, activeUsername),
      });
    },
  });
}

export function useGetFollowers(
  username: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.followers(username, 1, limit, activeUsername),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      backendService.getFollowers(username, pageParam, limit, activeUsername),
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination?.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage: any) => {
      return firstPage.pagination?.hasPrevious
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetFollowing(
  username: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.following(username, 1, limit, activeUsername),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      backendService.getFollowing(username, pageParam, limit, activeUsername),
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination?.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage: any) => {
      return firstPage.pagination?.hasPrevious
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetFollowSuggestions(
  options?: UseQueryOptions<IFollowSuggestion[], Error>,
  activeUsername?: string
) {
  return useQuery<IFollowSuggestion[], Error>({
    queryKey: queryKeys.users.followSuggestions(activeUsername),
    queryFn: () => backendService.getFollowSuggestions(activeUsername),
    ...options,
  });
}

export function useProvideSuggestionFeedback() {
  return useMutation<{ message: string }, Error, FollowSuggestionFeedbackDto>({
    mutationFn: (dto) => backendService.provideSuggestionFeedback(dto),
  });
}

export function useRefreshSuggestions(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => backendService.refreshSuggestions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.followSuggestions(activeUsername),
      });
    },
  });
}

export function useRequestVerification(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IUserProfile, Error, void>({
    mutationFn: () => backendService.requestVerification(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useVerifyUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IUserProfile, Error, string>({
    mutationFn: (username) => backendService.verifyUser(username),
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byUsername(username, activeUsername),
      });
    },
  });
}

export function useWatchUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (usernameToWatch: string) =>
      backendService.watchUsername({ usernameToWatch }),
    onSuccess: (_) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useUnWatchUser(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (usernameToUnwatch: string) =>
      backendService.unwatchUsername(usernameToUnwatch),
    onSuccess: (_) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useUpdateInterests(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IUserProfile, Error, UpdateInterestsDto>({
    mutationFn: (dto) => backendService.updateInterests(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(activeUsername),
      });
    },
  });
}

export function useGetInterestSuggestions(
  options?: UseQueryOptions<
    { categories: string[]; popularHashtags: string[] },
    Error
  >
) {
  return useQuery<{ categories: string[]; popularHashtags: string[] }, Error>({
    queryKey: queryKeys.users.interestSuggestions,
    queryFn: () => backendService.getInterestSuggestions(),
    ...options,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<
    { postId: string; status: string; message: string; mediaUploads: number },
    Error,
    { createPostDto: CreatePostDto; mediaFiles?: File[] }
  >({
    mutationFn: ({ createPostDto, mediaFiles }) =>
      backendService.createPost(createPostDto, mediaFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.posts.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.feeds.timeline] });
    },
  });
}

export function useGetPostProgress(
  postId: string,
  options?: UseQueryOptions<
    {
      postId: string;
      status: string;
      progress: number;
      message: string;
      timestamp: Date;
    },
    Error
  >
) {
  return useQuery<
    {
      postId: string;
      status: string;
      progress: number;
      message: string;
      timestamp: Date;
    },
    Error
  >({
    queryKey: queryKeys.posts.progress(postId),
    queryFn: () => backendService.getPostProgress(postId),
    ...options,
  });
}

export function useGetPosts(
  limit: number = 20,
  username?: string,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.all(1, limit, username, activeUsername),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      backendService.getPosts(pageParam, limit, username, activeUsername),
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination?.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage: any) => {
      return firstPage.pagination?.hasPrevious
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetTrendingPosts(
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.trending(1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getTrendingPosts(pageParam, limit, activeUsername),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetPost(
  postId: string,
  options?: UseQueryOptions<IPost, Error>,
  activeUsername?: string
) {
  return useQuery<IPost, Error>({
    queryKey: queryKeys.posts.byId(postId, activeUsername),
    queryFn: () => backendService.getPost(postId, activeUsername),
    ...options,
  });
}

export function useUpdatePost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    IPost,
    Error,
    { postId: string; updatePostDto: UpdatePostDto; mediaFiles?: File[] }
  >({
    mutationFn: ({ postId, updatePostDto, mediaFiles }) =>
      backendService.updatePost(postId, updatePostDto, mediaFiles),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(data.id, activeUsername),
      });
      queryClient.invalidateQueries({ queryKey: [queryKeys.posts.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.feeds.timeline] });
    },
  });
}

export function useDeletePost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({ queryKey: [queryKeys.posts.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.feeds.timeline] });
    },
  });
}

export function useLikePost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.likePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.likes(postId, 1, 20, activeUsername),
      });
    },
  });
}

export function useUnlikePost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.unlikePost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.likes(postId, 1, 20, activeUsername),
      });
    },
  });
}

export function usePinPost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.pinPost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
    },
  });
}

export function useUnpinPost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.unpinPost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
    },
  });
}

export function useGetPostLikes(
  postId: string,
  limit: number = 20,
  activeUsername?: string,
  isEnabled?: boolean
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.likes(postId, 1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getPostLikes(postId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: isEnabled,
  });
}

export function useVotePoll(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { postId: string; votePollDto: VotePollDto }
  >({
    mutationFn: ({ postId, votePollDto }) =>
      backendService.votePoll(postId, votePollDto),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.pollResults(postId, activeUsername),
      });
    },
  });
}

export function useRemovePollVote(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.removePollVote(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.pollResults(postId, activeUsername),
      });
    },
  });
}

export function useGetPollResults(
  postId: string,
  options?: UseQueryOptions<{ poll: any }, Error>,
  activeUsername?: string
) {
  return useQuery<{ poll: any }, Error>({
    queryKey: queryKeys.posts.pollResults(postId, activeUsername),
    queryFn: () => backendService.getPollResults(postId, activeUsername),
    ...options,
  });
}

export function useGetPollVoters(
  postId: string,
  optionId: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.pollVoters(
      postId,
      optionId,
      1,
      limit,
      activeUsername
    ),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getPollVoters(
        postId,
        optionId,
        pageParam,
        limit,
        activeUsername
      ),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useRepost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IPost, Error, string>({
    mutationFn: (postId) => backendService.repost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.reposts(postId, 1, 20, activeUsername),
      });
      queryClient.invalidateQueries({ queryKey: [queryKeys.feeds.timeline] });
    },
  });
}

export function useRepostWithComment(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IPost, Error, { postId: string; comment: string }>({
    mutationFn: ({ postId, comment }) =>
      backendService.repostWithComment(postId, comment),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.reposts(postId, 1, 20, activeUsername),
      });
      queryClient.invalidateQueries({ queryKey: [queryKeys.feeds.timeline] });
    },
  });
}

export function useRemoveRepost(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId) => backendService.removeRepost(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.byId(postId, activeUsername),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.reposts(postId, 1, 20, activeUsername),
      });
      queryClient.invalidateQueries({ queryKey: [queryKeys.feeds.timeline] });
    },
  });
}

export function useGetReposts(
  postId: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.reposts(postId, 1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getReposts(postId, pageParam, limit, activeUsername),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

// Comment hooks
export function useCreateComment(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<IComment, Error, CreateCommentDto>({
    mutationFn: (dto) => backendService.createComment(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(data.postId, 1, 20, activeUsername),
      });
    },
  });
}

export function useGetPostComments(
  postId: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments.byPost(postId, 1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getPostComments(postId, pageParam, limit, activeUsername),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetCommentReplies(
  commentId: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments.replies(commentId, 1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getCommentReplies(
        commentId,
        pageParam,
        limit,
        activeUsername
      ),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useUpdateComment(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    IComment,
    Error,
    { commentId: string; updateCommentDto: UpdateCommentDto }
  >({
    mutationFn: ({ commentId, updateCommentDto }) =>
      backendService.updateComment(commentId, updateCommentDto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byId(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(data.postId, 1, 20, activeUsername),
      });
    },
  });
}

export function useDeleteComment(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { commentId: string; postId: string }
  >({
    mutationFn: ({ commentId }) => backendService.deleteComment(commentId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(postId, 1, 20, activeUsername),
      });
    },
  });
}

export function useLikeComment(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (commentId) => backendService.likeComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });
    },
  });
}

export function useUnlikeComment(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (commentId) => backendService.unlikeComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byId(commentId),
      });
    },
  });
}

// Feed hooks
export function useGetTimeline(
  limit: number = 20,
  username?: string,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.feeds.timeline(1, limit, username, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getTimeline(pageParam, limit, username),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

// Hashtag hooks
export function useGetTrendingHashtags(
  limit: number = 20,
  options?: UseQueryOptions<IHashtag[], Error>,
  activeUsername?: string
) {
  return useQuery<IHashtag[], Error>({
    queryKey: queryKeys.hashtags.trending(limit, activeUsername),
    queryFn: () => backendService.getTrendingHashtags(limit, activeUsername),
    ...options,
  });
}

export function useSearchHashtags(
  query: string,
  limit: number = 10,
  options?: UseQueryOptions<IHashtag[], Error>,
  activeUsername?: string
) {
  return useQuery<IHashtag[], Error>({
    queryKey: queryKeys.hashtags.search(query, limit, activeUsername),
    queryFn: () => backendService.searchHashtags(query, limit, activeUsername),
    enabled: query.length > 0,
    ...options,
  });
}

export function useGetHashtagPosts(
  tag: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.hashtags.posts(tag, 1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getHashtagPosts(tag, pageParam, limit, activeUsername),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useSearchUsers(
  query: string,
  limit: number = 10,
  options?: UseQueryOptions<{ data: IUserBasic[]; total: number }, Error>,
  activeUsername?: string
) {
  return useQuery<{ data: IUserBasic[]; total: number }, Error>({
    queryKey: queryKeys.search.users(query, limit, activeUsername),
    queryFn: () => backendService.searchUsers(query, limit, activeUsername),
    enabled: query.length > 0,
    ...options,
  });
}

export function useSearchPosts(
  query: string,
  limit: number = 20,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.search.posts(query, 1, limit, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.searchPosts(query, pageParam, limit, activeUsername),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: query.length > 0,
  });
}

export function useSearchHashtagsInSearch(
  query: string,
  limit: number = 10,
  options?: UseQueryOptions<IHashtag[], Error>,
  activeUsername?: string
) {
  return useQuery<IHashtag[], Error>({
    queryKey: queryKeys.search.hashtags(query, limit, activeUsername),
    queryFn: () =>
      backendService.searchHashtagsInSearch(query, limit, activeUsername),
    enabled: query.length > 0,
    ...options,
  });
}

export function useAutocomplete(
  query: string,
  type: "users" | "hashtags",
  limit: number = 5,
  options?: UseQueryOptions<IUserBasic[] | IHashtag[], Error>,
  activeUsername?: string
) {
  return useQuery<IUserBasic[] | IHashtag[], Error>({
    queryKey: queryKeys.search.autocomplete(query, type, limit, activeUsername),
    queryFn: () =>
      backendService.getAutocomplete(query, type, limit, activeUsername),
    enabled: query.length > 0,
    ...options,
  });
}

export function useNotifications(
  limit: number = 20,
  unreadOnly: boolean = false,
  activeUsername?: string
) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.all(1, limit, unreadOnly, activeUsername),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getNotifications(pageParam, limit, unreadOnly),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!activeUsername,
  });
}

export function useMarkNotificationAsRead(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (notificationId) =>
      backendService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.notifications.all],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(activeUsername),
      });
    },
  });
}

export function useMarkAllNotificationsAsRead(activeUsername?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => backendService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.notifications.all],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(activeUsername),
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (notificationId) =>
      backendService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.notifications.all],
      });
    },
  });
}

export function useInviteUser() {
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (username) => backendService.inviteUser(username),
  });
}

export function useUploadMedia() {
  return useMutation<string[], Error, { files: File[] }>({
    mutationFn: ({ files }) => backendService.uploadMultipleFiles(files),
  });
}

export function useUploadProgress(uploadId: string) {
  return useQuery<UploadProgress, Error>({
    queryKey: queryKeys.media.uploadProgress(uploadId),
    queryFn: () => backendService.getUploadProgress(uploadId),
  });
}

export function useDownloadUrl(fileUrl: string) {
  return useQuery<
    {
      downloadUrl: string;
      filename: string;
      expiresIn: number;
    },
    Error
  >({
    queryKey: queryKeys.media.downloadUrl(fileUrl),
    queryFn: () => backendService.getDownloadUrl(fileUrl),
  });
}

export function useGetMediaInfo(fileUrl: string) {
  return useQuery<
    {
      filename: string;
      size: number;
      mimetype: string;
      lastModified: Date;
    },
    Error
  >({
    queryKey: queryKeys.media.info(fileUrl),
    queryFn: () => backendService.getMediaInfo(fileUrl),
  });
}

// Message hooks
export function useUserConversations(
  client: Client,
  limit: number = 20,
  activeUsername?: string
) {
  return useQuery({
    queryKey: queryKeys.conversations.all(1, limit, activeUsername),
    queryFn: () => client.conversations.list(),
  });
}

export function useCreateGroupConversation(client: Client) {
  const queryClient = useQueryClient();

  return useMutation<
    Group,
    Error,
    { name: string; description: string; inboxIds: string[] }
  >({
    mutationFn: async ({ name, description, inboxIds }) => {
      return await client.conversations.newGroup(inboxIds, {
        name,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.conversations.all],
      });
    },
  });
}

export function useGetConversationMembers(
  conversation: Conversation,
  limit: number = 20
) {
  return useQuery({
    queryKey: queryKeys.conversations.members(conversation?.id, 1, limit),
    queryFn: () => conversation.members(),
    initialData: [],
    enabled: !!conversation,
  });
}

export function useRemoveMember(group: Group) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { inboxIds: string[] }>({
    mutationFn: ({ inboxIds }) => group.removeMembers(inboxIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.members(group.id, 1, 20),
      });
    },
  });
}

export function useAddMember(group: Group) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { inboxId: string; level: PermissionLevel }>({
    mutationFn: ({ inboxId, level }) => {
      if (level === PermissionLevel.SuperAdmin) {
        return group.addSuperAdmin(inboxId);
      } else if (level === PermissionLevel.Admin) {
        return group.addAdmin(inboxId);
      } else {
        return group.addMembers([inboxId]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.members(group.id, 1, 20),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.byId(group.id),
      });
    },
  });
}

export function useGetMessages(
  conversation?: Conversation,
  limit: number = 50,
  activeUsername?: string
) {
  return useQuery({
    queryKey: queryKeys.messages.byConversation(
      conversation?.id,
      1,
      limit,
      activeUsername
    ),
    queryFn: () => conversation?.messages({ limit: BigInt(limit) }),
    enabled: !!conversation,
  });
}

export function usePinMessage(conversation: Conversation) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { messageId: string }>({
    mutationFn: ({ messageId }) => {
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.pinnedMessages(conversation.id),
      });
    },
  });
}

export function useUnpinMessage(conversation: Conversation) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { messageId: string }>({
    mutationFn: ({ messageId }) => {
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.pinnedMessages(conversation.id),
      });
    },
  });
}

export function usePinnedMessages(
  conversationId: string,
  options?: UseQueryOptions<DecodedMessage[], Error>
) {
  return useQuery<DecodedMessage[], Error>({
    queryKey: queryKeys.conversations.pinnedMessages(conversationId),
    queryFn: () => [],
    ...options,
  });
}

// Sticker hooks
export function useGetStickerPacks(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: queryKeys.stickers.packs(1, limit),
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      backendService.getStickerPacks(pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 0
        ? firstPage.pagination.page - 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useGetStickerPack(
  packId: string,
  options?: UseQueryOptions<StickerPack, Error>
) {
  return useQuery<StickerPack, Error>({
    queryKey: queryKeys.stickers.pack(packId),
    queryFn: () => backendService.getStickerPack(packId),
    ...options,
  });
}

export function useGetTrendingStickers(
  limit: number = 20,
  options?: UseQueryOptions<Sticker[], Error>
) {
  return useQuery<Sticker[], Error>({
    queryKey: queryKeys.stickers.trending(limit),
    queryFn: () => backendService.getTrendingStickers(limit),
    ...options,
  });
}

export function useGetRecentStickers(
  limit: number = 20,
  options?: UseQueryOptions<Sticker[], Error>
) {
  return useQuery<Sticker[], Error>({
    queryKey: queryKeys.stickers.recent(limit),
    queryFn: () => backendService.getRecentStickers(limit),
    ...options,
  });
}

export function useGetFeedAds(
  context: "feed" | "stories" | "sidebar",
  limit: number = 5
) {
  return useQuery<
    {
      ads: ISponsoredAd[];
      total: number;
      context: string;
    },
    Error
  >({
    queryKey: queryKeys.ads.feed(context, limit),
    queryFn: () => backendService.getFeedAds(context, limit),
  });
}

export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation<ISponsoredAd, Error, CreateAdDto>({
    mutationFn: (dto) => backendService.createAd(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.ads.feed] });
    },
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();

  return useMutation<
    ISponsoredAd,
    Error,
    { adId: string; updateAdDto: UpdateAdDto }
  >({
    mutationFn: ({ adId, updateAdDto }) =>
      backendService.updateAd(adId, updateAdDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.ads.feed] });
    },
  });
}

export function usePauseAd() {
  const queryClient = useQueryClient();

  return useMutation<ISponsoredAd, Error, string>({
    mutationFn: (adId) => backendService.pauseAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.ads.feed] });
    },
  });
}

export function useRecordAdInteraction() {
  return useMutation<
    { message: string },
    Error,
    {
      adId: string;
      dto: AdInteractionDto;
    }
  >({
    mutationFn: ({ adId, dto }) =>
      backendService.recordAdInteraction(adId, dto),
  });
}

export function useGetAdAnalytics(
  adId: string,
  options?: UseQueryOptions<
    {
      views: number;
      clicks: number;
      interactions: number;
      ctr: number;
      reach: number;
    },
    Error
  >
) {
  return useQuery<
    {
      views: number;
      clicks: number;
      interactions: number;
      ctr: number;
      reach: number;
    },
    Error
  >({
    queryKey: queryKeys.ads.analytics(adId),
    queryFn: () => backendService.getAdAnalytics(adId),
    ...options,
  });
}

export function useUserEngagementMetrics(
  options?: UseQueryOptions<
    {
      likes: number;
      comments: number;
      shares: number;
      followers: number;
      reach: number;
    },
    Error
  >
) {
  return useQuery<
    {
      likes: number;
      comments: number;
      shares: number;
      followers: number;
      reach: number;
    },
    Error
  >({
    queryKey: queryKeys.analytics.engagement,
    queryFn: () => backendService.getUserEngagementMetrics(),
    ...options,
  });
}

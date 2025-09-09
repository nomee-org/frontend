/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./client";
import {
  IUser,
  IUserProfile,
  IUserBasic,
  IPost,
  IComment,
  IHashtag,
  INotification,
  IConversation,
  IConversationParticipant,
  IMessage,
  IMessageReaction,
  IPinnedMessage,
  ISponsoredAd,
  IFollowSuggestion,
  AuthResponse,
  RefreshTokenDto,
  PaginatedResponse,
  MediaUploadResponse,
  UploadProgress,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateCommentDto,
  UpdateProfileDto,
  DeleteAccountDto,
  UpdateInterestsDto,
  WatchUserDto,
  CreateConversationDto,
  UpdateConversationDto,
  AddParticipantDto,
  CreateMessageDto,
  UpdateMessageDto,
  AddReactionDto,
  VotePollDto,
  FollowSuggestionFeedbackDto,
  CreateAdDto,
  UpdateAdDto,
  AdInteractionDto,
  SetupEncryptionDto,
  DecryptMessageDto,
  StickerPack,
  Sticker,
  ClientConfig,
} from "../../types/backend";

class BackendService {
  private apiClient: ApiClient;

  constructor(config: ClientConfig) {
    this.apiClient = new ApiClient(config.baseURL);
  }

  async getToken(username: string | null): Promise<AuthResponse> {
    if (!username)
      return {
        accessToken: undefined,
        refreshToken: undefined,
        user: undefined,
      };
    return this.apiClient.get<AuthResponse>(`/auth/token/${username}`);
  }

  async refreshToken(
    _: RefreshTokenDto
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.apiClient.get<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  async logout(): Promise<{ message: string }> {
    return this.apiClient.get<{ message: string }>("/auth/logout");
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.apiClient.setTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    this.apiClient.clearTokens();
  }

  async getUserProfile(): Promise<IUserProfile> {
    return this.apiClient.get<IUserProfile>("/users/profile");
  }

  async updateProfile(updateProfileDto: UpdateProfileDto): Promise<IUser> {
    return this.apiClient.put<IUser>("/users/profile", updateProfileDto);
  }

  async deleteAccount(
    deleteAccountDto: DeleteAccountDto
  ): Promise<{ message: string; deletionDate: Date }> {
    return this.apiClient.post<{ message: string; deletionDate: Date }>(
      "/users/account/delete",
      {
        data: deleteAccountDto,
      }
    );
  }

  async deactivateAccount(
    deleteAccountDto: DeleteAccountDto
  ): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      "/users/account/deactivate",
      deleteAccountDto
    );
  }

  async reactivateAccount(): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      "/users/account/reactivate"
    );
  }

  async getUserByUsername(
    username: string,
    activeUsername?: string
  ): Promise<IUserProfile> {
    return this.apiClient.get<IUserProfile>(
      `/users/${username}?activeUsername=${activeUsername}`
    );
  }

  async followUser(username: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/users/${username}/follow`
    );
  }

  async unfollowUser(username: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/users/${username}/follow`
    );
  }

  async blockUser(username: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(`/users/${username}/block`);
  }

  async unblockUser(username: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/users/${username}/block`
    );
  }

  async getFollowers(
    username: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IUserBasic>> {
    return this.apiClient.get<PaginatedResponse<IUserBasic>>(
      `/users/${username}/followers?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getFollowing(
    username: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IUserBasic>> {
    return this.apiClient.get<PaginatedResponse<IUserBasic>>(
      `/users/${username}/following?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getFollowSuggestions(
    activeUsername?: string
  ): Promise<IFollowSuggestion[]> {
    return this.apiClient.get<IFollowSuggestion[]>(
      `/users/suggestions/follow?activeUsername=${activeUsername}`
    );
  }

  async provideSuggestionFeedback(
    feedbackDto: FollowSuggestionFeedbackDto
  ): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      "/users/suggestions/feedback",
      feedbackDto
    );
  }

  async refreshSuggestions(): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      "/users/suggestions/refresh"
    );
  }

  async requestVerification(): Promise<IUserProfile> {
    return this.apiClient.post<IUserProfile>("/users/verify");
  }

  async verifyUser(username: string): Promise<IUserProfile> {
    return this.apiClient.put<IUserProfile>(`/users/verify/${username}`);
  }

  async getOnlineUsers(limit: number = 50): Promise<IUserBasic[]> {
    return this.apiClient.get<IUserBasic[]>(`/users/online?limit=${limit}`);
  }

  async updateInterests(
    updateInterestsDto: UpdateInterestsDto
  ): Promise<IUserProfile> {
    return this.apiClient.put<IUserProfile>(
      "/users/interests",
      updateInterestsDto
    );
  }

  async getInterestSuggestions(): Promise<{
    categories: string[];
    popularHashtags: string[];
  }> {
    return this.apiClient.get<{
      categories: string[];
      popularHashtags: string[];
    }>("/users/interests/suggestions");
  }

  async createPost(
    createPostDto: CreatePostDto,
    mediaFiles?: File[]
  ): Promise<{
    postId: string;
    status: string;
    message: string;
    mediaUploads: number;
  }> {
    return this.apiClient.postWithFiles<{
      postId: string;
      status: string;
      message: string;
      mediaUploads: number;
    }>("/posts", createPostDto, undefined, "media", mediaFiles);
  }

  async getPostProgress(postId: string): Promise<{
    postId: string;
    status: string;
    progress: number;
    message: string;
    timestamp: Date;
  }> {
    return this.apiClient.get<{
      postId: string;
      status: string;
      progress: number;
      message: string;
      timestamp: Date;
    }>(`/posts/${postId}/progress`);
  }

  async getPosts(
    page: number = 1,
    limit: number = 20,
    username?: string,
    activeUsername?: string
  ): Promise<PaginatedResponse<IPost>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (username) params.append("username", username);

    return this.apiClient.get<PaginatedResponse<IPost>>(
      `/posts?${params}&activeUsername=${activeUsername}`
    );
  }

  async getTrendingPosts(
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IPost>> {
    return this.apiClient.get<PaginatedResponse<IPost>>(
      `/posts/trending?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getPost(postId: string, activeUsername?: string): Promise<IPost> {
    return this.apiClient.get<IPost>(
      `/posts/${postId}?activeUsername=${activeUsername}`
    );
  }

  async updatePost(
    postId: string,
    updatePostDto: UpdatePostDto,
    mediaFiles?: File[]
  ): Promise<IPost> {
    return this.apiClient.putWithFiles<IPost>(
      `/posts/${postId}`,
      updatePostDto,
      undefined,
      "media",
      mediaFiles
    );
  }

  async deletePost(postId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(`/posts/${postId}`);
  }

  async likePost(postId: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(`/posts/${postId}/like`);
  }

  async unlikePost(postId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(`/posts/${postId}/like`);
  }

  async pinPost(postId: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(`/posts/${postId}/pin`);
  }

  async unpinPost(postId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(`/posts/${postId}/pin`);
  }

  async getPostLikes(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<IUserBasic>> {
    return this.apiClient.get<PaginatedResponse<IUserBasic>>(
      `/posts/${postId}/likes?page=${page}&limit=${limit}`
    );
  }

  async votePoll(
    postId: string,
    votePollDto: VotePollDto
  ): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/posts/${postId}/poll/vote`,
      votePollDto
    );
  }

  async removePollVote(postId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/posts/${postId}/poll/vote`
    );
  }

  async getPollResults(
    postId: string,
    activeUsername?: string
  ): Promise<{ poll: any }> {
    return this.apiClient.get<{ poll: any }>(
      `/posts/${postId}/poll/results?activeUsername=${activeUsername}`
    );
  }

  async getPollVoters(
    postId: string,
    optionId: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IUserBasic>> {
    return this.apiClient.get<PaginatedResponse<IUserBasic>>(
      `/posts/${postId}/poll/voters/${optionId}?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async repost(postId: string): Promise<IPost> {
    return this.apiClient.post<IPost>(`/posts/${postId}/repost`);
  }

  async repostWithComment(postId: string, comment: string): Promise<IPost> {
    return this.apiClient.post<IPost>(`/posts/${postId}/repost-with-comment`, {
      comment,
    });
  }

  async removeRepost(postId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/posts/${postId}/repost`
    );
  }

  async getReposts(
    postId: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<any>> {
    return this.apiClient.get<PaginatedResponse<any>>(
      `/posts/${postId}/reposts?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async createComment(createCommentDto: CreateCommentDto): Promise<IComment> {
    return this.apiClient.post<IComment>("/comments", createCommentDto);
  }

  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IComment>> {
    return this.apiClient.get<PaginatedResponse<IComment>>(
      `/comments/post/${postId}?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getCommentReplies(
    commentId: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IComment>> {
    return this.apiClient.get<PaginatedResponse<IComment>>(
      `/comments/${commentId}/replies?page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto
  ): Promise<IComment> {
    return this.apiClient.put<IComment>(
      `/comments/${commentId}`,
      updateCommentDto
    );
  }

  async deleteComment(commentId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(`/comments/${commentId}`);
  }

  async likeComment(commentId: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/comments/${commentId}/like`
    );
  }

  async unlikeComment(commentId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/comments/${commentId}/like`
    );
  }

  async getTimeline(
    page: number = 1,
    limit: number = 20,
    username?: string
  ): Promise<PaginatedResponse<IPost> & { ads?: ISponsoredAd[] }> {
    return this.apiClient.get<
      PaginatedResponse<IPost> & { ads?: ISponsoredAd[] }
    >(`/feeds/timeline?page=${page}&limit=${limit}&username=${username}`);
  }

  async getTrendingHashtags(
    limit: number = 20,
    activeUsername?: string
  ): Promise<IHashtag[]> {
    return this.apiClient.get<IHashtag[]>(
      `/hashtags/trending?limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async searchHashtags(
    query: string,
    limit: number = 10,
    activeUsername?: string
  ): Promise<IHashtag[]> {
    return this.apiClient.get<IHashtag[]>(
      `/hashtags/search?q=${encodeURIComponent(
        query
      )}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getHashtagPosts(
    tag: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IPost>> {
    return this.apiClient.get<PaginatedResponse<IPost>>(
      `/hashtags/tag/posts?tag=${tag}&page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async searchUsers(
    query: string,
    limit: number = 10,
    activeUsername?: string
  ): Promise<{ data: IUserBasic[]; total: number }> {
    return this.apiClient.get<{ data: IUserBasic[]; total: number }>(
      `/search/users?q=${encodeURIComponent(
        query
      )}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async watchUsername(dto: WatchUserDto): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(`/users/watch`, dto);
  }

  async unwatchUsername(
    usernameToUnwatch: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/users/watch/${usernameToUnwatch}`
    );
  }

  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 20,
    activeUsername?: string
  ): Promise<PaginatedResponse<IPost>> {
    return this.apiClient.get<PaginatedResponse<IPost>>(
      `/search/posts?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async searchHashtagsInSearch(
    query: string,
    limit: number = 10,
    activeUsername?: string
  ): Promise<IHashtag[]> {
    return this.apiClient.get<IHashtag[]>(
      `/search/hashtags?q=${encodeURIComponent(
        query
      )}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getAutocomplete(
    query: string,
    type: "users" | "hashtags",
    limit: number = 5,
    activeUsername?: string
  ): Promise<IUserBasic[] | IHashtag[]> {
    return this.apiClient.get<IUserBasic[] | IHashtag[]>(
      `/search/autocomplete?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=${limit}&activeUsername=${activeUsername}`
    );
  }

  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<PaginatedResponse<INotification>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (unreadOnly) params.append("unread", "true");

    return this.apiClient.get<PaginatedResponse<INotification>>(
      `/notifications?${params}`
    );
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.apiClient.get<{ count: number }>("/notifications/unread-count");
  }

  async markNotificationAsRead(
    notificationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.put<{ message: string }>(
      `/notifications/${notificationId}/read`
    );
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.apiClient.put<{ message: string }>("/notifications/read-all");
  }

  async deleteNotification(
    notificationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/notifications/${notificationId}`
    );
  }

  async subscribeToHashtag(hashtag: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/notifications/subscribe/hashtag/${hashtag}`
    );
  }

  async unsubscribeFromHashtag(hashtag: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/notifications/subscribe/hashtag/${hashtag}`
    );
  }

  async subscribeToViralContent(): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      "/notifications/subscribe/viral-content"
    );
  }

  async subscribeToTrendingHashtags(): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      "/notifications/subscribe/trending-hashtags"
    );
  }

  async uploadFile(file: File): Promise<MediaUploadResponse> {
    return this.apiClient.uploadFile<MediaUploadResponse>(
      "/media/upload",
      file,
      "file"
    );
  }

  async getUploadProgress(uploadId: string): Promise<UploadProgress> {
    return this.apiClient.get<UploadProgress>(
      `/media/upload/${uploadId}/progress`
    );
  }

  async uploadMultipleFiles(
    files: File[]
  ): Promise<{ files: MediaUploadResponse[]; count: number }> {
    return this.apiClient.uploadFiles<{
      files: MediaUploadResponse[];
      count: number;
    }>("/media/upload-multiple", files, "files");
  }

  async deleteFile(key: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(`/media/${key}`);
  }

  async getDownloadUrl(
    fileUrl: string
  ): Promise<{ downloadUrl: string; filename: string; expiresIn: number }> {
    return this.apiClient.get<{
      downloadUrl: string;
      filename: string;
      expiresIn: number;
    }>(`/media/download?url=${encodeURIComponent(fileUrl)}`);
  }

  async getMediaInfo(fileUrl: string): Promise<{
    filename: string;
    size: number;
    mimetype: string;
    lastModified: Date;
  }> {
    return this.apiClient.get<{
      filename: string;
      size: number;
      mimetype: string;
      lastModified: Date;
    }>(`/media/info?url=${encodeURIComponent(fileUrl)}`);
  }

  async sendMessage(
    createMessageDto: CreateMessageDto,
    mediaFile?: File
  ): Promise<IMessage> {
    return this.apiClient.postWithFile<IMessage>(
      "/messages",
      createMessageDto,
      undefined,
      "media",
      mediaFile
    );
  }

  async sendStickerMessage(
    conversationId: string,
    stickerId: string
  ): Promise<IMessage> {
    return this.apiClient.post<IMessage>("/messages/sticker", {
      conversationId,
      stickerId,
    });
  }

  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<IMessage> & { isEncrypted: boolean }> {
    return this.apiClient.get<
      PaginatedResponse<IMessage> & { isEncrypted: boolean }
    >(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`);
  }

  async updateMessage(
    messageId: string,
    updateMessageDto: UpdateMessageDto
  ): Promise<IMessage> {
    return this.apiClient.put<IMessage>(
      `/messages/${messageId}`,
      updateMessageDto
    );
  }

  async deleteMessage(messageId: string): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(`/messages/${messageId}`);
  }

  async addMessageReaction(
    messageId: string,
    addReactionDto: AddReactionDto
  ): Promise<IMessageReaction> {
    return this.apiClient.post<IMessageReaction>(
      `/messages/${messageId}/reactions`,
      addReactionDto
    );
  }

  async removeMessageReaction(
    messageId: string,
    emoji: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/messages/${messageId}/reactions/${emoji}`
    );
  }

  async markMessageAsRead(messageId: string): Promise<{ message: string }> {
    return this.apiClient.put<{ message: string }>(
      `/messages/${messageId}/read`
    );
  }

  async searchMessages(
    conversationId: string,
    query: string,
    limit: number = 20
  ): Promise<IMessage[]> {
    return this.apiClient.get<IMessage[]>(
      `/messages/search/${conversationId}?q=${encodeURIComponent(
        query
      )}&limit=${limit}`
    );
  }

  async enableConversationEncryption(
    conversationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/messages/conversation/${conversationId}/enable-encryption`
    );
  }

  async getConversationEncryptionStatus(conversationId: string): Promise<any> {
    return this.apiClient.get<any>(
      `/messages/conversation/${conversationId}/encryption-status`
    );
  }

  async createConversation(
    createConversationDto: CreateConversationDto
  ): Promise<IConversation> {
    return this.apiClient.post<IConversation>(
      "/conversations",
      createConversationDto
    );
  }

  async getUserConversations(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<IConversation> & { summary: any }> {
    return this.apiClient.get<
      PaginatedResponse<IConversation> & { summary: any }
    >(`/conversations?page=${page}&limit=${limit}`);
  }

  async getConversation(conversationId: string): Promise<IConversation> {
    return this.apiClient.get<IConversation>(
      `/conversations/${conversationId}`
    );
  }

  async updateConversation(
    conversationId: string,
    updateConversationDto: UpdateConversationDto
  ): Promise<IConversation> {
    return this.apiClient.put<IConversation>(
      `/conversations/${conversationId}`,
      updateConversationDto
    );
  }

  async deleteConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/conversations/${conversationId}`
    );
  }

  async addParticipant(
    conversationId: string,
    addParticipantDto: AddParticipantDto
  ): Promise<IConversationParticipant> {
    return this.apiClient.post<IConversationParticipant>(
      `/conversations/${conversationId}/participants`,
      addParticipantDto
    );
  }

  async removeParticipant(
    conversationId: string,
    username: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/conversations/${conversationId}/participants/${username}`
    );
  }

  async updateParticipantRole(
    conversationId: string,
    username: string,
    role: string
  ): Promise<IConversationParticipant> {
    return this.apiClient.put<IConversationParticipant>(
      `/conversations/${conversationId}/participants/${username}/role`,
      { role }
    );
  }

  async muteConversation(conversationId: string): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/conversations/${conversationId}/mute`
    );
  }

  async unmuteConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/conversations/${conversationId}/mute`
    );
  }

  async lastReadConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.put<{ message: string }>(
      `/conversations/${conversationId}/last-read`
    );
  }

  async leaveConversation(
    conversationId: string
  ): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/conversations/${conversationId}/leave`
    );
  }

  async getConversationParticipants(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<IConversationParticipant>> {
    return this.apiClient.get<PaginatedResponse<IConversationParticipant>>(
      `/conversations/${conversationId}/participants?page=${page}&limit=${limit}`
    );
  }

  async getConversationUnreadCount(
    conversationId: string
  ): Promise<{ count: number }> {
    return this.apiClient.get<{ count: number }>(
      `/conversations/${conversationId}/unread-count`
    );
  }

  async getLastOpenedConversationCount(
    lastOpenedAt: Date
  ): Promise<{ count: number }> {
    return this.apiClient.get<{ count: number }>(
      `/conversations/last-opened-count?lastOpenedAt=${lastOpenedAt}`
    );
  }

  async pinMessage(
    conversationId: string,
    messageId: string
  ): Promise<IPinnedMessage> {
    return this.apiClient.post<IPinnedMessage>(
      `/conversations/${conversationId}/pin-message`,
      { messageId }
    );
  }

  async unpinMessage(
    conversationId: string,
    messageId: string
  ): Promise<{ message: string }> {
    return this.apiClient.delete<{ message: string }>(
      `/conversations/${conversationId}/pin-message/${messageId}`
    );
  }

  async getPinnedMessages(conversationId: string): Promise<IPinnedMessage[]> {
    return this.apiClient.get<IPinnedMessage[]>(
      `/conversations/${conversationId}/pinned-messages`
    );
  }

  async getStickerPacks(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<StickerPack>> {
    return this.apiClient.get<PaginatedResponse<StickerPack>>(
      `/stickers/packs?page=${page}&limit=${limit}`
    );
  }

  async getStickerPack(packId: string): Promise<StickerPack> {
    return this.apiClient.get<StickerPack>(`/stickers/pack/${packId}`);
  }

  async getTrendingStickers(limit: number = 20): Promise<Sticker[]> {
    return this.apiClient.get<Sticker[]>(`/stickers/trending?limit=${limit}`);
  }

  async getRecentStickers(limit: number = 20): Promise<Sticker[]> {
    return this.apiClient.get<Sticker[]>(`/stickers/recent?limit=${limit}`);
  }

  async getFeedAds(
    context: "feed" | "stories" | "sidebar" = "feed",
    limit: number = 3
  ): Promise<{ ads: any[]; total: number; context: string }> {
    return this.apiClient.get<{ ads: any[]; total: number; context: string }>(
      `/ads/feed?context=${context}&limit=${limit}`
    );
  }

  async recordAdInteraction(
    adId: string,
    adInteractionDto: AdInteractionDto
  ): Promise<{ message: string }> {
    return this.apiClient.post<{ message: string }>(
      `/ads/${adId}/interaction`,
      adInteractionDto
    );
  }

  async getAdAnalytics(adId: string): Promise<any> {
    return this.apiClient.get<any>(`/ads/${adId}/analytics`);
  }

  async createAd(
    createAdDto: CreateAdDto,
    mediaFiles?: File[]
  ): Promise<ISponsoredAd> {
    return this.apiClient.postWithFiles<ISponsoredAd>(
      "/ads",
      createAdDto,
      undefined,
      "media",
      mediaFiles
    );
  }

  async updateAd(
    adId: string,
    updateAdDto: UpdateAdDto,
    mediaFiles?: File[]
  ): Promise<ISponsoredAd> {
    return this.apiClient.putWithFiles<ISponsoredAd>(
      `/ads/${adId}`,
      updateAdDto,
      undefined,
      "media",
      mediaFiles
    );
  }

  async pauseAd(adId: string): Promise<ISponsoredAd> {
    return this.apiClient.put<ISponsoredAd>(`/ads/${adId}/pause`);
  }

  async resumeAd(adId: string): Promise<ISponsoredAd> {
    return this.apiClient.put<ISponsoredAd>(`/ads/${adId}/resume`);
  }

  async setupEncryption(
    setupEncryptionDto: SetupEncryptionDto
  ): Promise<{ message: string; keyPairId: string; publicKey: string }> {
    return this.apiClient.post<{
      message: string;
      keyPairId: string;
      publicKey: string;
    }>("/encryption/setup", setupEncryptionDto);
  }

  async getUserKeyPair(): Promise<{ hasEncryption: boolean; keyPair?: any }> {
    return this.apiClient.get<{ hasEncryption: boolean; keyPair?: any }>(
      "/encryption/keypair"
    );
  }

  async generateKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
    algorithm: string;
    message: string;
  }> {
    return this.apiClient.post<{
      publicKey: string;
      privateKey: string;
      algorithm: string;
      message: string;
    }>("/encryption/generate-keypair");
  }

  async decryptMessage(
    messageId: string,
    decryptMessageDto: DecryptMessageDto
  ): Promise<{
    messageId: string;
    content: string;
    type: any;
    createdAt: Date;
  }> {
    return this.apiClient.post<{
      messageId: string;
      content: string;
      type: any;
      createdAt: Date;
    }>(`/encryption/decrypt-message/${messageId}`, decryptMessageDto);
  }

  async rotateConversationKeys(
    conversationId: string
  ): Promise<{ message: string; keyVersion: number }> {
    return this.apiClient.post<{ message: string; keyVersion: number }>(
      `/encryption/rotate-keys/${conversationId}`
    );
  }

  getAccessToken(): string | null {
    return this.apiClient.getAccessToken();
  }

  async batchLikePosts(
    postIds: string[]
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      postIds.map((postId) => this.likePost(postId))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        success.push(postIds[index]);
      } else {
        failed.push(postIds[index]);
      }
    });

    return { success, failed };
  }

  async batchFollowUsers(
    usernames: string[]
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      usernames.map((username) => this.followUser(username))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        success.push(usernames[index]);
      } else {
        failed.push(usernames[index]);
      }
    });

    return { success, failed };
  }

  async batchMarkNotificationsAsRead(
    notificationIds: string[]
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      notificationIds.map((id) => this.markNotificationAsRead(id))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        success.push(notificationIds[index]);
      } else {
        failed.push(notificationIds[index]);
      }
    });

    return { success, failed };
  }

  async trackInteraction(
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      await this.apiClient.post("/analytics/track", {
        event,
        data,
        timestamp: new Date(),
      });
    } catch (error) {
      // Analytics errors shouldn't break the app
      console.warn("Analytics tracking failed:", error);
    }
  }

  async getUserEngagementMetrics(): Promise<any> {
    return this.apiClient.get<any>("/analytics/engagement");
  }

  async getContentMetrics(postId: string): Promise<any> {
    return this.apiClient.get<any>(`/analytics/content/${postId}`);
  }
}

export const backendService = new BackendService({
  baseURL: import.meta.env.VITE_NOMEE_BACKEND_URL,
  wsURL: import.meta.env.VITE_NOMEE_BACKEND_WS_URL,
});

export interface IUser {
  id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  interests?: string[];
}

export interface IUserProfile extends IUser {
  fcmToken?: string;
  watchUsernames?: string[];
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface IUserBasic {
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isOnline?: boolean;
  lastSeenAt?: Date;
}

export interface IPost {
  id: string;
  content: string;
  mediaUrls: string[];
  isPinned: boolean;
  isDeleted: boolean;
  hasPoll: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: IUserBasic;
  hashtags?: IPostHashtag[];
  mentions?: IMention[];
  poll?: IPoll;
  reposts?: IRepost[];
  comments?: IComment[];
  likes?: ILike[];
  _count: {
    likes: number;
    comments: number;
    reposts: number;
  };
}

export interface IComment {
  id: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  postId: string;
  parentId?: string;
  author: IUserBasic;
  mentions?: IMention[];
  replies?: IComment[];
  _count: {
    likes: number;
    replies: number;
  };
}

export interface ILike {
  id: string;
  createdAt: Date;
  userId: string;
  postId?: string;
  commentId?: string;
  user: IUserBasic;
}

export interface IFollow {
  id: string;
  createdAt: Date;
  followerId: string;
  followingId: string;
  follower: IUserBasic;
  following: IUserBasic;
}

export interface IHashtag {
  id: string;
  tag: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostHashtag {
  postId: string;
  hashtagId: string;
  hashtag: IHashtag;
}

export interface IMention {
  id: string;
  createdAt: Date;
  mentionedUserId: string;
  postId?: string;
  commentId?: string;
  mentionedUser: {
    username: string;
  };
}

export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  userId: string;
  senderId?: string;
  sender?: IUserBasic;
}

export interface IPoll {
  id: string;
  question: string;
  isAnonymous: boolean;
  allowMultiple: boolean;
  expiresAt?: Date;
  createdAt: Date;
  postId: string;
  options: IPollOption[];
  _count: {
    votes: number;
  };
}

export interface IPollOption {
  id: string;
  text: string;
  order: number;
  pollId: string;
  _count: {
    votes: number;
  };
}

export interface IPollVote {
  id: string;
  createdAt: Date;
  userId: string;
  pollId: string;
  optionId: string;
  user: IUserBasic;
}

export interface IRepost {
  id: string;
  comment?: string;
  createdAt: Date;
  userId: string;
  originalPostId: string;
  repostId: string;
  originalPost: IPost;
}

export interface IConversation {
  id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  avatarUrl?: string;
  isEncrypted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageId?: string;
  participants: IConversationParticipant[];
  lastMessage?: IMessage;
  pinnedMessages?: IPinnedMessage[];
  unreadCount?: number;
  _count: {
    participants: number;
    messages: number;
    pinnedMessages: number;
  };
}

export interface IConversationParticipant {
  id: string;
  role: ParticipantRole;
  isActive: boolean;
  isMuted: boolean;
  lastReadAt: Date;
  joinedAt: Date;
  conversationId: string;
  userId: string;
  user: IUserBasic;
}

export interface IMessage {
  id: string;
  content?: string;
  encryptedContent?: string;
  type: MessageType;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  stickerUrl?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;
  senderId: string;
  replyToId?: string;
  sender: IUserBasic;
  replyTo?: IMessage;
  reactions: IMessageReaction[];
}

export interface IMessageReaction {
  id: string;
  emoji: string;
  createdAt: Date;
  messageId: string;
  userId: string;
  user: IUserBasic;
}

export interface IPinnedMessage {
  id: string;
  createdAt: Date;
  conversationId: string;
  messageId: string;
  pinnedById: string;
  message: IMessage;
  pinnedBy: IUserBasic;
}

export interface ISponsoredAd {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaText: string;
  ctaUrl: string;
  targetUrl: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetGenders: string[];
  targetCountries: string[];
  targetInterests: string[];
  targetHashtags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdInteraction {
  id: string;
  type: AdInteractionType;
  createdAt: Date;
  userId: string;
  adId: string;
  user: IUserBasic;
}

export interface IFollowSuggestion {
  id: string;
  reason: FollowSuggestionReason;
  score: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  isShown: boolean;
  isDismissed: boolean;
  createdAt: Date;
  updatedAt: Date;
  suggestedUserId: string;
  targetUserId: string;
  suggestedUser: IUserBasic & {
    _count: {
      followers: number;
      posts: number;
    };
  };
}

// Enums
export enum NotificationType {
  FOLLOW = "FOLLOW",
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  MENTION = "MENTION",
  POST_REPLY = "POST_REPLY",
  TRENDING_HASHTAG = "TRENDING_HASHTAG",
  MESSAGE = "MESSAGE",
  GROUP_INVITE = "GROUP_INVITE",
  POLL_VOTE = "POLL_VOTE",
  VERIFICATION_APPROVED = "VERIFICATION_APPROVED",
  REPOST = "REPOST",
}

export enum ConversationType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}

export enum ParticipantRole {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  OWNER = "OWNER",
}

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  VOICE = "VOICE",
  FILE = "FILE",
  STICKER = "STICKER",
}

export enum AdInteractionType {
  IMPRESSION = "IMPRESSION",
  CLICK = "CLICK",
  CONVERSION = "CONVERSION",
  DISMISS = "DISMISS",
}

export enum FollowSuggestionReason {
  MUTUAL_FRIENDS = "MUTUAL_FRIENDS",
  POPULAR_USER = "POPULAR_USER",
  SIMILAR_INTERESTS = "SIMILAR_INTERESTS",
  HASHTAG_SIMILARITY = "HASHTAG_SIMILARITY",
  ACTIVITY_BASED = "ACTIVITY_BASED",
}

// API Response types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string | string[];
}

export interface AuthResponse {
  user?: IUserProfile;
  accessToken?: string;
  refreshToken?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface WatchUserDto {
  usernameToWatch: string;
}

// Media types
export interface MediaUploadResponse {
  url?: string;
  uploadId: string;
  status: "processing" | "completed" | "failed";
  message: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  filename?: string;
  mimetype?: string;
  isEncrypted?: boolean;
}

export interface UploadProgress {
  uploadId: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  message: string;
  timestamp: Date;
}

// DTOs
export interface CreatePostDto {
  content: string;
  poll?: CreatePollDto;
}

export interface CreatePollDto {
  question: string;
  options: string[];
  isAnonymous?: boolean;
  allowMultiple?: boolean;
  expiresAt?: string;
}

export interface UpdatePostDto {
  content?: string;
}

export interface CreateCommentDto {
  postId: string;
  parentId?: string;
  content: string;
}

export interface UpdateCommentDto {
  content?: string;
}

export interface UpdateProfileDto {
  bio?: string;
  avatarUrl?: string;
  fcmToken?: string;
}

export interface DeleteAccountDto {
  reason: string;
  feedback?: string;
  deleteContent?: boolean;
}

export interface UpdateInterestsDto {
  interests: string[];
}

export interface CreateConversationDto {
  type: ConversationType;
  name?: string;
  description?: string;
  participantUsernames: string[];
}

export interface UpdateConversationDto {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

export interface AddParticipantDto {
  username: string;
  role?: ParticipantRole;
}

export interface CreateMessageDto {
  conversationId: string;
  content?: string;
  type?: MessageType;
  replyToId?: string;
  encryptedContent?: string;
  userPassword?: string;
}

export interface UpdateMessageDto {
  content?: string;
}

export interface AddReactionDto {
  emoji: string;
}

export interface VotePollDto {
  optionIds: string[];
}

export interface FollowSuggestionFeedbackDto {
  suggestedUserId: string;
  action: "followed" | "dismissed" | "not_interested";
  reason?: string;
}

export interface CreateAdDto {
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaText: string;
  ctaUrl: string;
  targetUrl: string;
  budget: number;
  startDate: string;
  endDate?: string;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetGenders?: string[];
  targetCountries?: string[];
  targetInterests?: string[];
  targetHashtags?: string[];
}

export interface UpdateAdDto extends Partial<CreateAdDto> {
  isActive?: boolean;
}

export interface AdInteractionDto {
  type: AdInteractionType;
}

export interface SetupEncryptionDto {
  publicKey: string;
  encryptedPrivateKey: string;
  enableByDefault?: boolean;
}

export interface DecryptMessageDto {
  password: string;
}

// WebSocket event types

export interface SocketEventPayload<T> {
  event: string;
  data: T;
  timestamp: Date;
  userId?: string;
}

// Sticker types
export interface StickerPack {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  stickers: Sticker[];
}

export interface Sticker {
  id: string;
  url: string;
  name: string;
  tags: string[];
  packId?: string;
  packName?: string;
}

// Configuration types
export interface ClientConfig {
  baseURL: string;
  wsURL: string;
  timeout?: number;
  retries?: number;
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

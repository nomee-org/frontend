/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from "socket.io-client";
import {
  IPost,
  IComment,
  ILike,
  IMessage,
  IMessageReaction,
  IUserBasic,
  INotification,
  UploadProgress,
  MediaUploadResponse,
} from "../../types/backend";

export interface WebSocketConfig {
  url: string;
  token?: string;
  username?: string;
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface WebSocketEventHandlers {
  id: string;

  onAuthenticated?: (data: { success: boolean; userId?: string }) => void;
  onAuthenticationFailed?: (error: string) => void;

  onNewPost?: (post: IPost) => void;
  onPostCreationProgress?: (progress: {
    postId: string;
    status: string;
    progress: number;
    message: string;
    timestamp: Date;
  }) => void;
  onPostCreationComplete?: (post: IPost) => void;
  onPostCreationError?: (error: { postId: string; error: string }) => void;
  onNewComment?: (comment: IComment) => void;
  onNewLike?: (like: ILike) => void;
  onPopularPostUpdate?: (data: {
    postId: string;
    likesCount: number;
    commentsCount: number;
    engagementScore: number;
  }) => void;
  onViralPost?: (post: IPost & { engagementScore: number }) => void;

  onNewFollower?: (follower: IUserBasic) => void;
  onFollowingStatusUpdate?: (update: { username: string }) => void;

  onNewMessage?: (message: IMessage) => void;
  onMessageReaction?: (reaction: IMessageReaction) => void;
  onRemoveMessageReaction?: (data: {
    messageId: string;
    reactionId: string;
  }) => void;
  onMessageUpdated?: (message: IMessage) => void;
  onMessageDeleted?: (data: { messageId: string }) => void;
  onMessageRead?: (data: { messageId: string }) => void;
  onUserTyping?: (data: { username: string; conversationId: string }) => void;
  onUserStoppedTyping?: (data: {
    username: string;
    conversationId: string;
  }) => void;
  onUserRecording?: (data: {
    username: string;
    conversationId: string;
  }) => void;
  onUserStoppedRecording?: (data: {
    username: string;
    conversationId: string;
  }) => void;

  onNotification?: (notification: INotification) => void;

  onMediaUploadProgress?: (progress: UploadProgress) => void;
  onMediaUploadComplete?: (result: MediaUploadResponse) => void;
  onMediaUploadError?: (error: { uploadId: string; error: string }) => void;

  onPollVote?: (data: {
    pollId: string;
    voter: string;
    optionIds: string[];
  }) => void;
  onPollExpired?: (data: { pollId: string; finalResults: any }) => void;

  onHashtagTrending?: (data: {
    hashtag: string;
    recentUsage: number;
    trendingScore: number;
  }) => void;
  onTrendingHashtagUpdate?: (data: {
    hashtag: string;
    recentUsage: number;
    trendingScore: number;
  }) => void;

  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onReconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandlers[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isAuthenticated: boolean = false;
  private joinedRooms: Set<string> = new Set();
  private addedListeners: Set<string> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 1000;
  }

  connect(): void {
    if (this.socket?.connected) {
      console.warn("WebSocket already connected");
      return;
    }

    this.socket = io(this.config.url, {
      auth: {
        token: this.config.token,
      },
      transports: ["websocket"],
      timeout: 20_000,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
      this.joinedRooms.clear();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  setEventHandlers(handlers: WebSocketEventHandlers): void {
    if (!this.addedListeners.has(handlers.id)) {
      this.handlers.push(handlers);
      this.addedListeners.add(handlers.id);
    }
  }

  removeEventHandlers(handlers: WebSocketEventHandlers): void {
    if (this.addedListeners.has(handlers.id)) {
      const index = this.handlers.findIndex((h) => h.id === handlers.id);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
      this.addedListeners.delete(handlers.id);
    }
  }

  authenticate(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("authenticate", { username: this.config.username });
    }
  }

  joinPost(postId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("join-post", { postId });
      this.joinedRooms.add(`post:${postId}`);
    }
  }

  leavePost(postId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("leave-post", { postId });
      this.joinedRooms.delete(`post:${postId}`);
    }
  }

  joinConversation(conversationId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("join-conversation", { conversationId });
      this.joinedRooms.add(`conversation:${conversationId}`);
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("leave-conversation", { conversationId });
      this.joinedRooms.delete(`conversation:${conversationId}`);
    }
  }

  joinPoll(pollId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("join-poll", { pollId });
      this.joinedRooms.add(`poll:${pollId}`);
    }
  }

  leavePoll(pollId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("leave-poll", { pollId });
      this.joinedRooms.delete(`poll:${pollId}`);
    }
  }

  startTyping(conversationId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("typing-start", {
        conversationId,
        username: this.config.username,
      });
    }
  }

  stopTyping(conversationId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("typing-stop", {
        conversationId,
        username: this.config.username,
      });
    }
  }

  startRecording(conversationId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("recording-start", {
        conversationId,
        username: this.config.username,
      });
    }
  }

  stopRecording(conversationId: string): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("recording-stop", {
        conversationId,
        username: this.config.username,
      });
    }
  }

  getJoinedRooms(): string[] {
    return Array.from(this.joinedRooms);
  }

  leaveAllRooms(): void {
    this.joinedRooms.forEach((room) => {
      const [type, id] = room.split(":");
      switch (type) {
        case "post":
          this.leavePost(id);
          break;
        case "conversation":
          this.leaveConversation(id);
          break;
        case "poll":
          this.leavePoll(id);
          break;
      }
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.authenticate();
      this.handlers.forEach((handler) => handler.onConnect?.());
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("WebSocket disconnected:", reason);
      this.isAuthenticated = false;
      this.joinedRooms.clear();
      this.handlers.forEach((handler) => handler.onDisconnect?.(reason));

      if (this.config.autoReconnect !== false) {
        this.handleReconnection();
      }
    });

    this.socket.on("reconnect", () => {
      console.log("WebSocket reconnected");
      this.handlers.forEach((handler) => handler.onReconnect?.());
    });

    this.socket.on("error", (error: any) => {
      console.error("WebSocket error:", error);
      this.handlers.forEach((handler) => handler.onError?.(error));
    });

    this.socket.on(
      "authenticated",
      (data: { success: boolean; userId?: string }) => {
        if (data.success) {
          this.isAuthenticated = true;
          console.log("WebSocket authenticated successfully");
        }
        this.handlers.forEach((handler) => handler.onAuthenticated?.(data));
      }
    );

    this.socket.on("new-post", (post: IPost) => {
      this.handlers.forEach((handler) => handler.onNewPost?.(post));
    });

    this.socket.on("post-creation-progress", (progress: any) => {
      this.handlers.forEach((handler) =>
        handler.onPostCreationProgress?.(progress)
      );
    });

    this.socket.on("post-creation-complete", (post: IPost) => {
      this.handlers.forEach((handler) =>
        handler.onPostCreationComplete?.(post)
      );
    });

    this.socket.on("post-creation-error", (error: any) => {
      this.handlers.forEach((handler) => handler.onPostCreationError?.(error));
    });

    this.socket.on("new-comment", (comment: IComment) => {
      this.handlers.forEach((handler) => handler.onNewComment?.(comment));
    });

    this.socket.on("new-like", (like: ILike) => {
      this.handlers.forEach((handler) => handler.onNewLike?.(like));
    });

    this.socket.on("popular-post-update", (data: any) => {
      this.handlers.forEach((handler) => handler.onPopularPostUpdate?.(data));
    });

    this.socket.on("viral-post", (post: any) => {
      this.handlers.forEach((handler) => handler.onViralPost?.(post));
    });

    this.socket.on("new-follower", (follower: IUserBasic) => {
      this.handlers.forEach((handler) => handler.onNewFollower?.(follower));
    });

    this.socket.on("following-status-update", (update: any) => {
      this.handlers.forEach((handler) =>
        handler.onFollowingStatusUpdate?.(update)
      );
    });

    this.socket.on("new-message", (message: IMessage) => {
      this.handlers.forEach((handler) => handler.onNewMessage?.(message));
    });

    this.socket.on("message-reaction", (reaction: IMessageReaction) => {
      this.handlers.forEach((handler) => handler.onMessageReaction?.(reaction));
    });

    this.socket.on(
      "remove-message-reaction",
      (data: { messageId: string; reactionId: string }) => {
        this.handlers.forEach((handler) =>
          handler.onRemoveMessageReaction?.(data)
        );
      }
    );

    this.socket.on("message-updated", (message: IMessage) => {
      this.handlers.forEach((handler) => handler.onMessageUpdated?.(message));
    });

    this.socket.on("message-deleted", (data: { messageId: string }) => {
      this.handlers.forEach((handler) => handler.onMessageDeleted?.(data));
    });

    this.socket.on("message-read", (data: { messageId: string }) => {
      this.handlers.forEach((handler) => handler.onMessageRead?.(data));
    });

    this.socket.on(
      "user-typing",
      (data: { username: string; conversationId: string }) => {
        this.handlers.forEach((handler) => handler.onUserTyping?.(data));
      }
    );

    this.socket.on(
      "user-stopped-typing",
      (data: { username: string; conversationId: string }) => {
        this.handlers.forEach((handler) => handler.onUserStoppedTyping?.(data));
      }
    );

    this.socket.on(
      "user-recording",
      (data: { username: string; conversationId: string }) => {
        this.handlers.forEach((handler) => handler.onUserRecording?.(data));
      }
    );

    this.socket.on(
      "user-stopped-recording",
      (data: { username: string; conversationId: string }) => {
        this.handlers.forEach((handler) =>
          handler.onUserStoppedRecording?.(data)
        );
      }
    );

    this.socket.on("notification", (notification: INotification) => {
      this.handlers.forEach((handler) =>
        handler.onNotification?.(notification)
      );
    });

    this.socket.on("media-upload-progress", (progress: UploadProgress) => {
      this.handlers.forEach((handler) =>
        handler.onMediaUploadProgress?.(progress)
      );
    });

    this.socket.on("media-upload-complete", (result: MediaUploadResponse) => {
      this.handlers.forEach((handler) =>
        handler.onMediaUploadComplete?.(result)
      );
    });

    this.socket.on("media-upload-error", (error: any) => {
      this.handlers.forEach((handler) => handler.onMediaUploadError?.(error));
    });

    this.socket.on("poll-vote", (data: any) => {
      this.handlers.forEach((handler) => handler.onPollVote?.(data));
    });

    this.socket.on("poll-expired", (data: any) => {
      this.handlers.forEach((handler) => handler.onPollExpired?.(data));
    });

    this.socket.on("hashtag-trending", (data: any) => {
      this.handlers.forEach((handler) => handler.onHashtagTrending?.(data));
    });

    this.socket.on("trending-hashtag-update", (data: any) => {
      this.handlers.forEach((handler) =>
        handler.onTrendingHashtagUpdate?.(data)
      );
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConnectionStatus(): {
    connected: boolean;
    authenticated: boolean;
    joinedRooms: string[];
    reconnectAttempts: number;
  } {
    return {
      connected: this.socket?.connected || false,
      authenticated: this.isAuthenticated,
      joinedRooms: Array.from(this.joinedRooms),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  emit(event: string, data: any): void {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, handler: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }
}

export const webSocketService = new WebSocketService({
  url: import.meta.env.VITE_NOMEE_BACKEND_WS_URL,
});

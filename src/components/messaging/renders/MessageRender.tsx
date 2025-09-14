/* eslint-disable @typescript-eslint/no-explicit-any */

import { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isNomeeAction,
  plainTextFromFilename,
  summarizeAttachment,
} from "../actions/utils";
import { NomeeAction } from "../actions";
import {
  ContentTypeRemoteAttachment,
  RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";

// Component props
type MessageRenderProps = {
  conversation: Conversation;
  message: DecodedMessage;
  isOwn: boolean;
};

export const MessageRender = ({
  conversation,
  message,
  isOwn,
}: MessageRenderProps) => {
  const renderRichContent = (content?: string) => {
    if (!content) return "";

    // Convert newlines to <br> tags
    let richContent = content.replace(/\n/g, "<br>");

    // Make URLs clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    richContent = richContent.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">$1</a>'
    );

    // Make emails clickable
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    richContent = richContent.replace(
      emailRegex,
      '<a href="mailto:$1" class="underline text-blue-400 hover:text-blue-300">$1</a>'
    );

    // Make mentions clickable
    const mentionRegex = /(?!<[^>]*>)@([a-zA-Z0-9._-]+)(?![^<]*<\/a>)/g;
    richContent = richContent.replace(
      mentionRegex,
      '<a href="/names/$1" target="_blank" class="text-accent hover:text-accent/80 hover:underline font-medium" onclick="event.stopPropagation()">@$1</a>'
    );

    return richContent;
  };

  // === Message Renderer ===
  const renderContent = (
    content: any,
    contentType: any,
    isReply = false
  ): JSX.Element | null => {
    // === Attachments ===
    if (contentType.sameAs(ContentTypeRemoteAttachment)) {
      const attachment = content as RemoteAttachment;

      const caption =
        content && !isReply ? (
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: renderRichContent(
                plainTextFromFilename(attachment.filename)
              ),
            }}
          />
        ) : null;

      if (attachment.filename.includes("image/")) {
        return (
          <div className="space-y-2">
            {attachment.url && (
              <img
                src={attachment.url}
                alt="Shared image"
                className={`max-w-full object-contain rounded-lg ${
                  isReply ? "h-24" : "h-[220px] md:h-[320px]"
                }`}
                onClick={() => window.open(attachment.url, "_blank")}
              />
            )}
            {caption}
          </div>
        );
      }

      if (attachment.filename.includes("video/")) {
        return (
          <div className="space-y-2">
            {attachment.url && (
              <video
                src={attachment.url}
                controls
                className={`max-w-full object-contain rounded-lg ${
                  isReply ? "h-24" : "h-[220px] md:h-[320px]"
                }`}
              />
            )}
            {caption}
          </div>
        );
      }

      if (attachment.filename.includes("audio/")) {
        return (
          <div className="space-y-2">
            {attachment.url && (
              <audio
                src={attachment.url}
                controls
                className="w-full rounded-lg"
              />
            )}
            {caption}
          </div>
        );
      }

      if (attachment.filename.includes("sticker/")) {
        return (
          <div className={isReply ? "w-16 h-16" : "w-32 h-32"}>
            {attachment.url && (
              <img
                src={attachment.url}
                alt="Sticker"
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-3 bg-black/10 p-3 rounded-lg">
          <div className="p-2 bg-white/10 rounded">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {plainTextFromFilename(attachment.filename)}
            </p>
            <p className="text-xs opacity-70">
              {summarizeAttachment(attachment.filename)}
            </p>
          </div>
          {attachment.url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => window.open(attachment.url!, "_blank")}
            >
              Download
            </Button>
          )}
        </div>
      );
    }

    // === Text ===
    if (contentType.sameAs(ContentTypeText)) {
      if (isNomeeAction(String(content))) {
        return (
          <NomeeAction
            conversation={conversation}
            message={message}
            data={String(content)}
            isOwn={isOwn}
          />
        );
      }

      return (
        <div
          className="text-sm leading-relaxed break-words whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: renderRichContent(String(content)),
          }}
        />
      );
    }

    // === Unsupported ===
    return (
      <div className="text-sm italic text-muted-foreground">
        Unsupported content
      </div>
    );
  };

  // === Reply Renderer ===
  const renderReplyContent = (reply: Reply) => {
    return <>{renderContent(reply.content, reply.contentType, true)}</>;
  };

  // === Main Renderer ===
  const renderMessageContent = () => {
    if (message.contentType.sameAs(ContentTypeReply)) {
      const reply = message.content as Reply;
      return renderReplyContent(reply);
    }

    return renderContent(message.content, message.contentType);
  };

  return <>{renderMessageContent()}</>;
};

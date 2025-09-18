/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ContentTypeRemoteAttachment,
  RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";

export const isNomeeAction = (data: string): boolean => {
  if (data.startsWith("accepted::")) return true;
  if (data.startsWith("rejected::")) return true;
  if (data.startsWith("cancelled::")) return true;
  if (data.startsWith("bought::")) return true;
  if (data.startsWith("proposal::")) return true;
  if (data.startsWith("created_listing::")) return true;
  if (data.startsWith("created_offer::")) return true;
  return false;
};

export const plainTextFromFilename = (filename: string): string => {
  if (!filename) return "Unknown";

  // Normalize (lowercase + strip query params/fragments)
  const normalized = filename.toLowerCase().split(/[?#]/)[0];

  // Check MIME-like patterns first
  if (normalized.includes("/")) {
    const [type] = normalized.split("/");
    switch (type) {
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "audio":
        return "Audio";
      case "application":
        if (normalized.includes("pdf")) return "PDF";
        if (normalized.includes("zip") || normalized.includes("tar"))
          return "Archive";
        return "Document";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  // Otherwise treat as filename with extension
  const ext = normalized.split(".").pop();
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
      return "Image";
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
      return "Video";
    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
      return "Audio";
    case "pdf":
      return "PDF";
    case "zip":
    case "tar":
    case "gz":
    case "rar":
      return "Archive";
    case "doc":
    case "docx":
    case "ppt":
    case "pptx":
    case "xls":
    case "xlsx":
      return "Document";
    default:
      return "File";
  }
};

export const summarizeAttachment = (filename: string, prefix = ""): string => {
  if (/image/i.test(filename)) return `${prefix}Image`;
  if (/video/i.test(filename)) return `${prefix}Video`;
  if (/sticker/i.test(filename)) return `${prefix}Sticker`;
  return `${prefix}Document`;
};

export const getSummary = (
  message: DecodedMessage,
  isOwn: boolean,
  simple = true
): string => {
  const senderPrefix = isOwn ? "Sent" : "Received";

  // attachments
  if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
    const attachment = message.content as RemoteAttachment;
    return simple
      ? `Attachment: ${summarizeAttachment(attachment.filename)}`
      : `${senderPrefix} ${summarizeAttachment(attachment.filename)}`;
  }

  // replies
  if (message.contentType.sameAs(ContentTypeReply)) {
    const reply = message.content as Reply;
    if (reply.contentType.sameAs(ContentTypeRemoteAttachment)) {
      const attachment = reply.content as RemoteAttachment;
      return simple
        ? `Reply: ${summarizeAttachment(attachment.filename)}`
        : `${senderPrefix} a reply with ${summarizeAttachment(
            attachment.filename
          ).toLowerCase()}`;
    }
    if (reply.contentType.sameAs(ContentTypeText)) {
      const str = String(reply.content);
      if (isNomeeAction(str)) {
        return "Reply: Nomee action";
      }
      return `Reply: ${str}`;
    }
    return "Reply: Unsupported content";
  }

  // text / Nomee
  if (message.contentType.sameAs(ContentTypeText)) {
    const str = String(message.content);

    if (isNomeeAction(str)) {
      if (str.startsWith("proposal::")) {
        return simple ? "Proposal request" : `${senderPrefix} a Nomee proposal`;
      }
      if (str.startsWith("created_listing::")) {
        return simple ? "Listing created" : `${senderPrefix} a Nomee listing`;
      }
      if (str.startsWith("created_offer::")) {
        return simple ? "Offer created" : `${senderPrefix} a Nomee offer`;
      }
      if (str.startsWith("accepted::")) {
        return simple
          ? "Action accepted"
          : `${senderPrefix} a Nomee acceptance`;
      }
      if (str.startsWith("rejected::")) {
        return simple ? "Action rejected" : `${senderPrefix} a Nomee rejection`;
      }
      if (str.startsWith("cancelled::")) {
        return simple
          ? "Action cancelled"
          : `${senderPrefix} a Nomee cancellation`;
      }
      if (str.startsWith("bought::")) {
        return simple ? "Purchase made" : `${senderPrefix} a Nomee purchase`;
      }
    }

    return simple ? str : `${senderPrefix} a message: ${str}`;
  }

  // reactions
  if (message.contentType.sameAs(ContentTypeReaction)) {
    const reaction = message.content as Reaction;
    return simple
      ? `Reaction: ${reaction.content}`
      : `${senderPrefix} a reaction: ${reaction.content}`;
  }

  return simple ? "A message." : `${senderPrefix} a message.`;
};

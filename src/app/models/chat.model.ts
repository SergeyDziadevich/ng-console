export interface ChatRoom {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members?: {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    lastReadAt?: string;
  }[];
  hasUnread?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: string;
}

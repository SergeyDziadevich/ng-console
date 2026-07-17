export interface NotificationMessage {
  id: string;
  title: string;
  body?: string;
  replayed: boolean;
  isSystem?: boolean;
  timestamp?: number;
  isRead?: boolean;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  ts: number;
  isSystem?: boolean;
  type?: string;
  isRead?: boolean;
  userId?: string;
}

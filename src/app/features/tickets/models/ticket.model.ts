export enum TicketStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in progress',
  DONE = 'done',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  authorId?: string;
}

export interface EpicTag {
  id: number;
  name: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: TicketStatus;
  priority?: TicketPriority;
  assignedPersonId?: string;
  about?: string;
  estimations?: number;
  comments?: Comment[];
  epic?: EpicTag;
}

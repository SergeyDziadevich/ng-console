export enum TicketStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in progress',
  DONE = 'done',
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  authorId?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: TicketStatus;
  assignedPersonId?: string;
  estimations?: number;
  comments?: Comment[];
}

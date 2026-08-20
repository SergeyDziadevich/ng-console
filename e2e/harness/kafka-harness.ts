/**
 * Kafka Asynchronous Event Streaming Harness & Assertion Suite
 * Validates domain event schemas, topic publishing, partition ordering, and consumer dispatch.
 */

import {
  UserCreatedEvent,
  TicketAssignedEvent,
  SubscriptionActivatedEvent,
  EmailNotificationEvent,
  AuditLogEvent,
  DocumentSignedEvent,
} from './test-types';

export type SupportedKafkaEvent =
  | UserCreatedEvent
  | TicketAssignedEvent
  | SubscriptionActivatedEvent
  | EmailNotificationEvent
  | AuditLogEvent
  | DocumentSignedEvent;

export interface PublishedKafkaRecord<T> {
  topic: string;
  key?: string;
  value: T;
  partition: number;
  offset: number;
  timestamp: string;
  headers?: Record<string, string>;
}

export class KafkaEventHarness {
  private topicStore: Map<string, PublishedKafkaRecord<SupportedKafkaEvent>[]> = new Map();
  private subscribers: Map<string, Array<(record: PublishedKafkaRecord<SupportedKafkaEvent>) => void>> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.topicStore.clear();
    this.subscribers.clear();
    const defaultTopics = [
      'user.created',
      'ticket.assigned',
      'subscription.activated',
      'email.notification',
      'audit-logs',
      'document.signed',
    ];
    for (const topic of defaultTopics) {
      this.topicStore.set(topic, []);
      this.subscribers.set(topic, []);
    }
  }

  async publish<T extends SupportedKafkaEvent>(
    topic: string,
    value: T,
    key?: string,
    headers?: Record<string, string>
  ): Promise<PublishedKafkaRecord<T>> {
    if (!this.topicStore.has(topic)) {
      this.topicStore.set(topic, []);
      this.subscribers.set(topic, []);
    }

    this.validateEventSchema(topic, value);

    const history = this.topicStore.get(topic)!;
    const record: PublishedKafkaRecord<T> = {
      topic,
      key,
      value,
      partition: 0,
      offset: history.length,
      timestamp: new Date().toISOString(),
      headers,
    };

    history.push(record as PublishedKafkaRecord<SupportedKafkaEvent>);

    const callbacks = this.subscribers.get(topic) || [];
    for (const cb of callbacks) {
      cb(record as PublishedKafkaRecord<SupportedKafkaEvent>);
    }

    return record;
  }

  subscribe(topic: string, handler: (record: PublishedKafkaRecord<SupportedKafkaEvent>) => void): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)!.push(handler);
    return () => {
      const list = this.subscribers.get(topic) || [];
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  getRecords(topic: string): PublishedKafkaRecord<SupportedKafkaEvent>[] {
    return this.topicStore.get(topic) || [];
  }

  getRecordCount(topic: string): number {
    return (this.topicStore.get(topic) || []).length;
  }

  assertEventPublished(topic: string, predicate: (event: SupportedKafkaEvent) => boolean): boolean {
    const records = this.getRecords(topic);
    return records.some((r) => predicate(r.value));
  }

  private validateEventSchema(topic: string, payload: SupportedKafkaEvent): void {
    switch (topic) {
      case 'user.created': {
        const u = payload as UserCreatedEvent;
        if (!u.userId || !u.email || !u.name) {
          throw new Error(`Invalid schema for topic ${topic}: missing required fields`);
        }
        break;
      }
      case 'ticket.assigned': {
        const t = payload as TicketAssignedEvent;
        if (!t.ticketId || !t.userId || !t.title) {
          throw new Error(`Invalid schema for topic ${topic}: missing ticketId, userId, or title`);
        }
        break;
      }
      case 'subscription.activated': {
        const s = payload as SubscriptionActivatedEvent;
        if (!s.userId || !s.planId || !s.manageLink) {
          throw new Error(`Invalid schema for topic ${topic}: missing subscription metadata`);
        }
        break;
      }
      case 'email.notification': {
        const e = payload as EmailNotificationEvent;
        if (!e.to || !e.name || !e.message) {
          throw new Error(`Invalid schema for topic ${topic}: missing to, name, or message`);
        }
        break;
      }
      case 'audit-logs': {
        const a = payload as AuditLogEvent;
        if (!a.action || !a.authorId) {
          throw new Error(`Invalid schema for topic ${topic}: missing action or authorId`);
        }
        break;
      }
      case 'document.signed': {
        const d = payload as DocumentSignedEvent;
        if (!d.documentId || !d.signerEmail || !d.title) {
          throw new Error(`Invalid schema for topic ${topic}: missing documentId, signerEmail, or title`);
        }
        break;
      }
    }
  }
}

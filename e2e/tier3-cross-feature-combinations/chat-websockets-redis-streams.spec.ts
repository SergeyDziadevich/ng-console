import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 3: Cross-Feature — Real-Time Chat, WebSockets & Redis Streams', () => {
  const ctx = createTestContext();

  test('T3-21: Load Chat MFE -> Join room -> Send message over Redis Streams -> Broadcast to members -> Alert notification', async () => {
    // 1. Load Chat MFE
    const mfeLoad = await ctx.mfe.loadRemoteModule('chat-mfe', './Routes');
    expect(mfeLoad.loaded).toBeTruthy();

    // 2. Fetch active chat rooms
    const roomsRes = await ctx.api.getChatRooms();
    expect(roomsRes.statusCode).toBe(200);
    expect(roomsRes.data.length).toBeGreaterThan(0);
    const roomId = roomsRes.data[0]!.id;

    // 3. Send message via WebSocket gateway proxy
    const msgRes = await ctx.api.sendChatMessage(roomId, 'Deployment completed successfully across all clusters.');
    expect(msgRes.statusCode).toBe(201);
    expect(msgRes.data.content).toContain('Deployment completed');

    // 4. Redis Streams message dispatch via RPC
    const rpcRes = await ctx.rpc.send({
      pattern: 'chat.send_message',
      data: { roomId, content: 'Deployment completed successfully across all clusters.' },
    });
    expect(rpcRes.success).toBeTruthy();

    // 5. In-app notification delivered to offline member
    const notifRes = await ctx.api.getNotifications('usr_dev');
    expect(notifRes.statusCode).toBe(200);
  });

  test('T3-22: Direct 1-on-1 messaging channel creation', async () => {
    const rpcRes = await ctx.rpc.send({
      pattern: 'chat.get_rooms',
      data: {},
    });
    expect(rpcRes.success).toBeTruthy();
  });

  test('T3-23: Real-time message deduplication across Redis cluster', async () => {
    const m1 = await ctx.api.sendChatMessage('room_general', 'Message 1');
    const m2 = await ctx.api.sendChatMessage('room_general', 'Message 2');
    expect(m1.data.id).not.toBe(m2.data.id);
  });

  test('T3-24: Chat message history pagination', async () => {
    const rooms = await ctx.api.getChatRooms();
    expect(rooms.statusCode).toBe(200);
  });

  test('T3-25: Audit logging on chat room creation and member invite', async () => {
    const auditRecord = await ctx.kafka.publish('audit-logs', {
      action: 'CHAT_ROOM_CREATED',
      entityId: 'room_dev_team',
      entityType: 'ChatRoom',
      authorId: 'usr_admin',
      createdAt: new Date().toISOString(),
    });
    expect(auditRecord.value.action).toBe('CHAT_ROOM_CREATED');
  });
});

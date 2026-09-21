import { EventBus } from './EventBus';

export interface NotificationEventMap {
  'notification:added': { id: string; type: string; title: string; message?: string };
  'notification:dismissed': { id: string };
  'notification:clearedAll': {};
  'notification:unreadCount': { count: number };
}

export type NotificationEvent = keyof NotificationEventMap;

export const notificationEvents = new EventBus();

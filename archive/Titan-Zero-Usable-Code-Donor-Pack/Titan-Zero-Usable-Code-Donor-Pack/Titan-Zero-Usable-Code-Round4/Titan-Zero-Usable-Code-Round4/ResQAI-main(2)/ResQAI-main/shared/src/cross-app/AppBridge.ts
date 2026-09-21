import { globalEventBus } from '../events/EventBus';
import type { CrossAppEvent, CrossAppEventMap } from './CrossAppEvents';
import { CROSS_APP_CHANNEL } from './CrossAppEvents';
import type { Unsubscribe } from '../events/EventBus';

let channel: BroadcastChannel | null = null;
let initialized = false;

export function initAppBridge(appId: string): void {
  if (initialized) return;
  initialized = true;
  try {
    channel = new BroadcastChannel(CROSS_APP_CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      const { type, payload, source } = event.data || {};
      if (source === appId) return;
      if (type) {
        globalEventBus.emit(type, payload);
      }
    };
  } catch {
    console.warn('[AppBridge] BroadcastChannel not available, using localStorage fallback');
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === CROSS_APP_CHANNEL && event.newValue) {
        try {
          const { type, payload, source } = JSON.parse(event.newValue);
          if (source !== appId && type) {
            globalEventBus.emit(type, payload);
          }
        } catch { }
      }
    });
  }
}

export function emitCrossAppEvent<T extends CrossAppEvent>(
  type: T,
  payload: CrossAppEventMap[T]
): void {
  const message = { type, payload, source: 'resqai', timestamp: Date.now() };
  if (channel) {
    channel.postMessage(message);
  } else {
    try {
      localStorage.setItem(CROSS_APP_CHANNEL, JSON.stringify(message));
      localStorage.removeItem(CROSS_APP_CHANNEL);
    } catch { }
  }
  globalEventBus.emit(type, payload);
}

export function onCrossAppEvent<T extends CrossAppEvent>(
  type: T,
  handler: (payload: CrossAppEventMap[T]) => void
): Unsubscribe {
  return globalEventBus.on(type, handler);
}

# ResQAI V2 — Events Layer

## Overview

The events layer provides a typed publish-subscribe event system built around `EventBus`. Each domain has its own event map for type-safe event handling.

## Modules

| Module | Events | Purpose |
|---|---|---|
| `ApplicationEvents` | `app:*` | App lifecycle, routing, theme, sidebar |
| `WorkflowEvents` | `workflow:*` | Workflow execution lifecycle |
| `AgentEvents` | `agent:*` | Agent conversation and execution |
| `NotificationEvents` | `notification:*` | Notification add/dismiss/clear |

## EventBus API

```ts
import { globalEventBus } from '../events';

const unsub = globalEventBus.on('app:routeChange', (payload) => {
  console.log(`Route changed: ${payload.from} -> ${payload.to}`);
});

globalEventBus.emit('app:routeChange', { from: '/', to: '/dashboard' });

unsub(); // remove listener
```

## Domain-Specific Buses

```ts
import { applicationEvents, agentEvents } from '../events';

applicationEvents.on('app:themeChange', ({ mode }) => {
  document.documentElement.setAttribute('data-theme', mode);
});

agentEvents.on('agent:message', ({ content, role }) => {
  console.log(`[${role}] ${content}`);
});
```

## Naming Convention

Events follow a `domain:action` pattern:
- `app:*` — application lifecycle
- `workflow:*` — workflow operations
- `agent:*` — agent interactions
- `notification:*` — notification management

## React Integration

```tsx
import { useEffect } from 'react';
import { agentEvents } from '../events';

function useAgentMessages(agentId: string, cb: (msg: string) => void) {
  useEffect(() => {
    return agentEvents.on('agent:message', (payload) => {
      if (payload.agentId === agentId) cb(payload.content);
    });
  }, [agentId, cb]);
}
```

## Testing

```ts
import { EventBus } from '../events';

describe('EventBus', () => {
  it('emits and receives events', () => {
    const bus = new EventBus();
    const spy = jest.fn();
    bus.on('test:event', spy);
    bus.emit('test:event', { foo: 'bar' });
    expect(spy).toHaveBeenCalledWith({ foo: 'bar' });
  });
});
```

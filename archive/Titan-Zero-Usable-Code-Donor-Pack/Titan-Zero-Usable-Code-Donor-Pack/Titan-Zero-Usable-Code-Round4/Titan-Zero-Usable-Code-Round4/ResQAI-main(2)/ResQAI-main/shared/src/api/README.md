# ResQAI V2 — API Layer

## Overview

The API layer provides a transport-agnostic HTTP client with authentication, error handling, retry logic, request queuing, and response caching.

## Modules

| Module | Purpose |
|---|---|
| `ApiClient` | Core HTTP client with typed methods (get/post/put/patch/delete) |
| `ErrorHandler` | Categorizes errors (auth/validation/server/network/timeout) and provides user-friendly messages |
| `RetryManager` | Exponential backoff retry for transient errors (408, 429, 5xx) |
| `AuthMiddleware` | Attaches auth tokens and handles token refresh on 401 |
| `RequestQueue` | Priority-based request queue with configurable concurrency |
| `CacheManager` | In-memory cache with TTL, LRU eviction, and pattern invalidation |

## Integration Example

```ts
import { ApiClient, ErrorHandler, RetryManager, AuthMiddleware, CacheManager } from '../api';

const client = new ApiClient({ baseUrl: 'https://api.example.com', timeout: 15000 });
const errorHandler = new ErrorHandler({
  onAuthError: () => { /* redirect to login */ },
  logError: (err, cat) => console.error(cat, err),
});
const retry = new RetryManager({ maxRetries: 3 });
const auth = new AuthMiddleware({ getToken: () => localStorage.getItem('token') });
const cache = new CacheManager({ ttl: 60000 });

await auth.apply(client);

async function fetchData<T>(path: string): Promise<T> {
  const cached = cache.get<T>(path);
  if (cached) return cached;

  return retry.execute(async () => {
    try {
      const res = await client.get<T>(path);
      cache.set(path, res.data);
      return res.data;
    } catch (err) {
      const category = errorHandler.handle(err as any);
      throw new Error(errorHandler.getUserMessage(err as any, category));
    }
  });
}
```

## Testing

Each class can be instantiated independently for unit testing. Mock `fetch` globally for `ApiClient` tests.

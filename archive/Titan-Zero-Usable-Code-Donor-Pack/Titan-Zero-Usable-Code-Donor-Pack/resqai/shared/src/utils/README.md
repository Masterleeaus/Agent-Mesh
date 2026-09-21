# ResQAI V2 — Utilities Layer

## Overview

Shared utility modules for validation, formatting, date manipulation, search, logging, and configuration.

## Modules

| Module | Purpose |
|---|---|
| `validation` | Form validation with composable rules (`required`, `email`, `minLength`, `maxLength`, `pattern`, `match`) |
| `formatting` | Currency (cents to $), percent, number, phone, truncation, pluralization |
| `date` | Date formatting, relative time, overdue checks, age calculations |
| `search` | Flexible array search with field targeting, case sensitivity, exact match, and fuzzy threshold |
| `logging` | Singleton logger with levels (debug/info/warn/error), history, and context support |
| `config` | App configuration from env vars with feature flags and environment detection |

## Usage Examples

### Validation

```ts
import { validate, validators } from '../utils';

const rules = [
  validators.required('email', 'Email'),
  validators.email('email'),
  validators.minLength('password', 8),
  validators.match('confirmPassword', 'password'),
];

const result = validate({ email: 'test@example.com', password: '12345678', confirmPassword: '12345678' }, rules);
// result.valid === true
```

### Formatting

```ts
import { formatCurrency, truncateText, pluralize } from '../utils';

formatCurrency(1999); // "$19.99"
truncateText('Hello world', 8); // "Hello..."
pluralize(3, 'item'); // "items"
```

### Date

```ts
import { formatRelative, isOverdue } from '../utils';

formatRelative(new Date(Date.now() - 3600000)); // "1h ago"
isOverdue('2024-01-01'); // true
```

### Search

```ts
import { search } from '../utils';

const items = [{ name: 'Alice' }, { name: 'Bob' }];
search(items, 'ali', { fields: ['name'] }); // [{ name: 'Alice' }]
```

### Logging

```ts
import { logger } from '../utils';

logger.setLevel('debug');
logger.info('User logged in', { userId: 'abc' }, 'auth');
logger.getHistory(); // Array of LogEntry
```

### Config

```ts
import { config } from '../utils';

config.load({ apiUrl: 'https://api.example.com' });
config.get('environment'); // 'development'
config.isFeatureEnabled('newDashboard'); // false
```

## Testing

Each utility is a pure function (except `Logger` singleton and `config`), making them trivial to unit test. For Logger, use `clearHistory()` between tests.

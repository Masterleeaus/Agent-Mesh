export interface QueueItem {
  id: string;
  execute: () => Promise<unknown>;
  priority: number;
  timestamp: number;
}

export interface QueueConfig {
  concurrency?: number;
  onItemStart?: (id: string) => void;
  onItemComplete?: (id: string) => void;
  onItemError?: (id: string, error: unknown) => void;
  onQueueDrain?: () => void;
}

export class RequestQueue {
  private queue: QueueItem[] = [];
  private active = 0;
  private config: Required<QueueConfig>;

  constructor(config: QueueConfig = {}) {
    this.config = {
      concurrency: 5,
      onItemStart: () => {},
      onItemComplete: () => {},
      onItemError: () => {},
      onQueueDrain: () => {},
      ...config,
    };
  }

  enqueue<T>(id: string, fn: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        execute: () => fn().then(resolve).catch(reject),
        priority,
        timestamp: Date.now(),
      });
      this.queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
      this.processNext();
    });
  }

  private processNext(): void {
    if (this.active >= this.config.concurrency || this.queue.length === 0) {
      if (this.active === 0 && this.queue.length === 0) this.config.onQueueDrain();
      return;
    }
    const item = this.queue.shift()!;
    this.active++;
    this.config.onItemStart(item.id);
    item.execute()
      .finally(() => {
        this.active--;
        this.config.onItemComplete(item.id);
        this.processNext();
      })
      .catch(err => this.config.onItemError(item.id, err));
  }

  get length(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.active;
  }

  clear(): void {
    this.queue = [];
  }
}

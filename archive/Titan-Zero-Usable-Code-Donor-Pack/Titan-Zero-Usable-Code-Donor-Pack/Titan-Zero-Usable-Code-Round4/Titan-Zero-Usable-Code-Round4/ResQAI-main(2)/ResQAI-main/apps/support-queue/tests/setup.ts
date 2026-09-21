import { vi } from 'vitest';

const mockClient = {
  initialize: vi.fn().mockResolvedValue({ status: 'authenticated' }),
  auth: { redirectToAuth: vi.fn() },
  records: {
    list: vi.fn().mockResolvedValue({ items: [] }),
    get: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'new-id' }),
    update: vi.fn(),
    bulkUpdate: vi.fn(),
  },
  agents: {
    run: vi.fn().mockResolvedValue({ id: 'conv-1' }),
  },
  conversations: {
    messages: {
      list: vi.fn().mockResolvedValue({ items: [] }),
    },
  },
  functions: {
    run: vi.fn(),
  },
};

vi.stubGlobal('LemmaClient', {
  LemmaClient: vi.fn().mockImplementation(function () {
    return mockClient;
  }),
});

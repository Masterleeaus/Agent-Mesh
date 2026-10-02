export type PendingCapture = {
  id: string;
  company_id: string;
  audio?: Blob;
  audioName?: string;
  photo?: Blob;
  photoName?: string;
  transcript?: string;
};

const DB_NAME = "dovetails-promise-capture";
const STORE = "pending";
const memory = new Map<string, PendingCapture>();

export function normalizePendingCompanyId(companyId: string): string {
  if (typeof companyId !== "string" || !companyId.trim()) throw new Error("company_id is required");
  return companyId.trim();
}

export function buildPendingStorageKey(companyId: string, id: string): string {
  return `${encodeURIComponent(normalizePendingCompanyId(companyId))}|${encodeURIComponent(id)}`;
}

type StoredCapture = PendingCapture & { capture_id: string };

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function savePending(item: PendingCapture): Promise<void> {
  const company_id = normalizePendingCompanyId(item.company_id);
  const key = buildPendingStorageKey(company_id, item.id);
  item = { ...item, company_id };
  memory.set(key, item);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    // Keep the existing store/keyPath; unscoped historical records are retained, never replayed.
    tx.objectStore(STORE).put({ ...item, id: key, capture_id: item.id });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function removePending(companyId: string, id: string): Promise<void> {
  const key = buildPendingStorageKey(companyId, id);
  memory.delete(key);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function listPending(companyId: string): Promise<PendingCapture[]> {
  const company_id = normalizePendingCompanyId(companyId);
  const scoped = () => [...memory.values()].filter((item) => item.company_id === company_id);
  const db = await openDb();
  if (!db) return scoped();
  const fromDb = await new Promise<StoredCapture[]>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as StoredCapture[]) ?? []);
    req.onerror = () => resolve([]);
  });
  db.close();
  for (const item of fromDb) {
    if (item.company_id !== company_id || typeof item.capture_id !== "string") continue;
    if (item.id !== buildPendingStorageKey(company_id, item.capture_id)) continue;
    memory.set(item.id, { ...item, id: item.capture_id });
  }
  return scoped();
}

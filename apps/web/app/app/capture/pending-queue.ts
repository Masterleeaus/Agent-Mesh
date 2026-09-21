export type PendingCapture = {
  id: string;
  audio?: Blob;
  audioName?: string;
  photo?: Blob;
  photoName?: string;
  transcript?: string;
};

type StoredPendingCapture = {
  id: string;
  company_id: string;
  capture: PendingCapture;
  authority_neutral: true;
  grants_authority: false;
};

const DB_NAME = "dovetails-promise-capture";
const STORE = "pending";
const memory = new Map<string, StoredPendingCapture>();

export function normalizePendingCompanyId(companyId: string): string {
  const value = String(companyId ?? "").trim();
  if (!value) throw new Error("company_id is required for pending capture storage");
  return value;
}

export function buildPendingStorageKey(companyId: string, captureId: string): string {
  const company_id = normalizePendingCompanyId(companyId);
  const id = String(captureId ?? "").trim();
  if (!id) throw new Error("capture id is required");
  return `${encodeURIComponent(company_id)}|${encodeURIComponent(id)}`;
}

function scopePending(companyId: string, item: PendingCapture): StoredPendingCapture {
  const company_id = normalizePendingCompanyId(companyId);
  return {
    id: buildPendingStorageKey(company_id, item.id),
    company_id,
    capture: item,
    authority_neutral: true,
    grants_authority: false,
  };
}

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

export async function savePending(companyId: string, item: PendingCapture): Promise<void> {
  const scoped = scopePending(companyId, item);
  memory.set(scoped.id, scoped);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(scoped);
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

function isScopedStoredCapture(value: unknown, companyId: string): value is StoredPendingCapture {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<StoredPendingCapture>;
  return (
    row.company_id === companyId &&
    row.authority_neutral === true &&
    row.grants_authority === false &&
    Boolean(row.capture && typeof row.capture === "object" && typeof row.capture.id === "string")
  );
}

export async function listPending(companyId: string): Promise<PendingCapture[]> {
  const company_id = normalizePendingCompanyId(companyId);
  const db = await openDb();
  if (!db) {
    return [...memory.values()]
      .filter((row) => row.company_id === company_id)
      .map((row) => row.capture);
  }
  const fromDb = await new Promise<unknown[]>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as unknown[]) ?? []);
    req.onerror = () => resolve([]);
  });
  db.close();

  // Legacy unscoped rows are deliberately retained but ignored. Assigning them
  // to the currently signed-in company would silently cross a company boundary.
  for (const raw of fromDb) {
    if (!isScopedStoredCapture(raw, company_id)) continue;
    memory.set(raw.id, raw);
  }
  return [...memory.values()]
    .filter((row) => row.company_id === company_id)
    .map((row) => row.capture);
}

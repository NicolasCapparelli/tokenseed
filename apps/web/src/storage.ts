import type { Repo } from "@tokenseed/core";

/**
 * The library lives in IndexedDB, one record per repository. When IndexedDB is unavailable
 * (some private windows), it falls back to memory so the app still works for the session.
 */
const DB = "tokenseed";
const STORE = "repos";
const memory = new Map<string, Repo>();

let dbPromise: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return db().then(
    (d) =>
      d &&
      new Promise<T>((resolve, reject) => {
        const req = fn(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  ).then((v) => v ?? undefined);
}

export const persistent = () => db().then((d) => !!d);

export async function listRepos(): Promise<Repo[]> {
  const all = (await run<Repo[]>("readonly", (s) => s.getAll() as IDBRequest<Repo[]>)) ?? [...memory.values()];
  return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getRepo(id: string): Promise<Repo | undefined> {
  return (await run<Repo>("readonly", (s) => s.get(id) as IDBRequest<Repo>)) ?? memory.get(id);
}

export async function putRepo(repo: Repo): Promise<void> {
  memory.set(repo.id, repo);
  await run("readwrite", (s) => s.put(repo));
}

export async function deleteRepo(id: string): Promise<void> {
  memory.delete(id);
  await run("readwrite", (s) => s.delete(id));
}

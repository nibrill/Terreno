/** Minimal IndexedDB wrapper: two object stores keyed by `id`. */
export type StoreName = 'templates' | 'records';

const DB_NAME = 'fieldlog';
const DB_VERSION = 1;

export class Db {
  private constructor(private db: IDBDatabase) {}

  /** Resolves to null when IndexedDB is unavailable (private mode, etc.). */
  static async open(): Promise<Db | null> {
    if (typeof indexedDB === 'undefined') return null;
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains('templates')) {
            d.createObjectStore('templates', { keyPath: 'id' });
          }
          if (!d.objectStoreNames.contains('records')) {
            d.createObjectStore('records', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => {
          // Let other tabs (or a version upgrade / delete) proceed.
          req.result.onversionchange = () => req.result.close();
          resolve(req.result);
        };
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('IndexedDB blocked'));
      });
      return new Db(db);
    } catch (e) {
      console.error('Terreno: IndexedDB unavailable', (e as Error)?.name, (e as Error)?.message);
      return null;
    }
  }

  private run<T>(
    store: StoreName,
    mode: IDBTransactionMode,
    fn: (s: IDBObjectStore) => IDBRequest<T> | void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  all<T>(store: StoreName): Promise<T[]> {
    return this.run<T[]>(store, 'readonly', (s) => s.getAll());
  }

  put(store: StoreName, value: { id: string }): Promise<unknown> {
    return this.run(store, 'readwrite', (s) => s.put(value));
  }

  putMany(store: StoreName, values: { id: string }[]): Promise<unknown> {
    return this.run(store, 'readwrite', (s) => {
      for (const v of values) s.put(v);
    });
  }

  delete(store: StoreName, id: string): Promise<unknown> {
    return this.run(store, 'readwrite', (s) => s.delete(id));
  }

  deleteMany(store: StoreName, ids: string[]): Promise<unknown> {
    return this.run(store, 'readwrite', (s) => {
      for (const id of ids) s.delete(id);
    });
  }
}

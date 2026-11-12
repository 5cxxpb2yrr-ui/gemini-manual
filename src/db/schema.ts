import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface CatalogItem {
  id: string;
  title: string;
  vehicle: string;
  year: number;
  engine: string;
  coverImage?: string;
  pageCount: number;
}

export interface ManualManifest {
  manualId: string;
  title: string;
  toc: TOCNode[];
}

export interface TOCNode {
  id: string;
  title: string;
  section: string;
  children?: TOCNode[];
}

export interface PageData {
  id: string;
  manualId: string;
  pageId: string;
  title: string;
  section: string;
  content: string;
}

export interface Bookmark {
  id: string;
  manualId: string;
  pageId: string;
  title: string;
  timestamp: number;
}

interface LifeOSDB extends DBSchema {
  catalog: { key: string; value: CatalogItem };
  manifests: { key: string; value: ManualManifest };
  pages: { key: string; value: PageData; indexes: { 'by-manual': string } };
  bookmarks: { key: string; value: Bookmark; indexes: { 'by-manual': string } };
  favorites: { key: string; value: Bookmark; indexes: { 'by-manual': string } };
}

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<LifeOSDB>>;

  constructor() {
    this.dbPromise = openDB<LifeOSDB>('lifeos_explorer', 1, {
      upgrade(db) {
        db.createObjectStore('catalog', { keyPath: 'id' });
        db.createObjectStore('manifests', { keyPath: 'manualId' });
        
        const pageStore = db.createObjectStore('pages', { keyPath: 'id' });
        pageStore.createIndex('by-manual', 'manualId');

        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarkStore.createIndex('by-manual', 'manualId');

        const favoriteStore = db.createObjectStore('favorites', { keyPath: 'id' });
        favoriteStore.createIndex('by-manual', 'manualId');
      },
    });
  }

  async getCatalog(): Promise<CatalogItem[]> {
    const db = await this.dbPromise;
    return db.getAll('catalog');
  }

  async saveCatalog(items: CatalogItem[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('catalog', 'readwrite');
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  }

  async getManifest(manualId: string): Promise<ManualManifest | undefined> {
    const db = await this.dbPromise;
    return db.get('manifests', manualId);
  }

  async saveManifest(manifest: ManualManifest): Promise<void> {
    const db = await this.dbPromise;
    await db.put('manifests', manifest);
  }

  async getPage(manualId: string, pageId: string): Promise<PageData | undefined> {
    const db = await this.dbPromise;
    return db.get('pages', `${manualId}::${pageId}`);
  }

  async savePage(page: PageData): Promise<void> {
    const db = await this.dbPromise;
    await db.put('pages', page);
  }

  async getAllPages(): Promise<PageData[]> {
    const db = await this.dbPromise;
    return db.getAll('pages');
  }

  async toggleFavorite(bookmark: Bookmark): Promise<boolean> {
    const db = await this.dbPromise;
    const existing = await db.get('favorites', bookmark.id);
    if (existing) {
      await db.delete('favorites', bookmark.id);
      return false;
    } else {
      await db.put('favorites', bookmark);
      return true;
    }
  }

  async isFavorite(id: string): Promise<boolean> {
    const db = await this.dbPromise;
    return !!(await db.get('favorites', id));
  }

  async getFavorites(): Promise<Bookmark[]> {
    const db = await this.dbPromise;
    return db.getAll('favorites');
  }
}

export const dbService = new DatabaseService();

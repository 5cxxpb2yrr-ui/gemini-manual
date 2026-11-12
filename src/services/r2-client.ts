import { dbService, CatalogItem, ManualManifest, PageData } from '../db/schema';

const R2_BASE_URL = 'https://r2.yourdomain.com/manuals';

export class R2Client {
  static async fetchCatalog(): Promise<CatalogItem[]> {
    try {
      const res = await fetch(`${R2_BASE_URL}/catalog.json`);
      if (!res.ok) throw new Error('Failed to fetch catalog from R2');
      const data: CatalogItem[] = await res.json();
      await dbService.saveCatalog(data);
      return data;
    } catch (err) {
      console.warn('R2 Offline fallback: Loading catalog from IndexedDB');
      return await dbService.getCatalog();
    }
  }

  static async fetchManifest(manualId: string): Promise<ManualManifest | undefined> {
    const cached = await dbService.getManifest(manualId);
    if (cached) return cached;

    try {
      const res = await fetch(`${R2_BASE_URL}/${manualId}/manifest.json`);
      if (!res.ok) throw new Error('Manifest not found in R2');
      const manifest: ManualManifest = await res.json();
      await dbService.saveManifest(manifest);
      return manifest;
    } catch (err) {
      console.error('Failed to resolve manifest:', err);
      return undefined;
    }
  }

  static async fetchPage(manualId: string, pageId: string): Promise<PageData | undefined> {
    const key = `${manualId}::${pageId}`;
    const cachedPage = await dbService.getPage(manualId, pageId);
    if (cachedPage) return cachedPage;

    try {
      const res = await fetch(`${R2_BASE_URL}/${manualId}/pages/${pageId}.html`);
      if (!res.ok) throw new Error(`Page ${pageId} not found in R2`);
      const htmlContent = await res.text();

      const pageData: PageData = {
        id: key,
        manualId,
        pageId,
        title: pageId,
        section: 'General',
        content: htmlContent,
      };

      await dbService.savePage(pageData);
      return pageData;
    } catch (err) {
      console.error('Error fetching page from R2:', err);
      return undefined;
    }
  }
}

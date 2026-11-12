import { dbService, PageData } from '../db/schema';

export interface SearchResult {
  manualId: string;
  pageId: string;
  title: string;
  section: string;
  snippet: string;
}

export class LocalSearchEngine {
  static async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim() === '') return [];
    
    const pages: PageData[] = await dbService.getAllPages();
    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const page of pages) {
      const text = page.content.replace(/<[^>]*>/g, '');
      const titleMatch = page.title.toLowerCase().includes(q);
      const bodyMatch = text.toLowerCase().includes(q);

      if (titleMatch || bodyMatch) {
        const matchIndex = text.toLowerCase().indexOf(q);
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(text.length, matchIndex + 80);
        const snippet = matchIndex >= 0 ? `...${text.substring(start, end)}...` : text.substring(0, 100);

        results.push({
          manualId: page.manualId,
          pageId: page.pageId,
          title: page.title,
          section: page.section,
          snippet
        });
      }
    }

    return results;
  }
}

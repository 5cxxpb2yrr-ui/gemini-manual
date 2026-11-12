import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/app-header';
import './components/manual-toc';
import './components/manual-viewer';
import { R2Client } from './services/r2-client';
import { CatalogItem } from './db/schema';
import { LocalSearchEngine, SearchResult } from './services/search-engine';

@customElement('app-root')
export class AppRoot extends LitElement {
  @state() private route = '';
  @state() private params: Record<string, string> = {};
  @state() private catalog: CatalogItem[] = [];
  @state() private searchResults: SearchResult[] = [];

  createRenderRoot() { return this; }

  async connectedCallback() {
    super.connectedCallback();
    this.catalog = await R2Client.fetchCatalog();
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  private async handleRoute() {
    const hash = window.location.hash.replace('#', '') || '/';
    
    if (hash.startsWith('/manual/')) {
      const parts = hash.split('/');
      this.route = 'manual';
      this.params = { manualId: parts[2], pageId: parts[4] || '' };
    } else if (hash.startsWith('/search')) {
      this.route = 'search';
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      const q = urlParams.get('q') || '';
      this.params = { q };
      this.searchResults = await LocalSearchEngine.search(q);
    } else {
      this.route = 'catalog';
      this.params = {};
    }
  }

  render() {
    return html`
      <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <app-header .searchQuery="${this.params.q || ''}"></app-header>

        <div class="flex-1">
          ${this.route === 'catalog' ? this.renderCatalog() : ''}
          ${this.route === 'manual' ? html`
            <manual-viewer .manualId="${this.params.manualId}" .pageId="${this.params.pageId}"></manual-viewer>
          ` : ''}
          ${this.route === 'search' ? this.renderSearch() : ''}
        </div>
      </div>
    `;
  }

  private renderCatalog() {
    return html`
      <main class="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h2 class="text-2xl font-black text-white tracking-wider">Garage Manual Library</h2>
          <p class="text-xs text-zinc-400 mt-1">Select a vehicle service manual to browse technical procedures and DTC diagnostic codes.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${this.catalog.map(item => html`
            <a href="#/manual/${item.id}" class="block bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 transition space-y-3 group">
              <div class="flex justify-between items-start">
                <span class="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">${item.year}</span>
                <span class="text-[10px] text-zinc-500 font-mono">${item.pageCount} pages</span>
              </div>
              <div>
                <h3 class="font-bold text-white group-hover:text-amber-400 transition text-base">${item.title}</h3>
                <p class="text-xs text-zinc-400 font-mono mt-0.5">${item.engine}</p>
              </div>
              <div class="text-xs font-bold text-amber-400 flex items-center space-x-1 pt-2">
                <span>Open Manual</span>
                <span>→</span>
              </div>
            </a>
          `)}
        </div>
      </main>
    `;
  }

  private renderSearch() {
    return html`
      <main class="max-w-5xl mx-auto p-6 space-y-4">
        <h2 class="text-lg font-bold text-white">Search Results for "${this.params.q}"</h2>
        <div class="space-y-3">
          ${this.searchResults.map(res => html`
            <a href="#/manual/${res.manualId}/page/${res.pageId}" class="block bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-4 transition space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-amber-400">${res.title}</span>
                <span class="font-mono text-zinc-500">${res.manualId}</span>
              </div>
              <p class="text-xs text-zinc-400">${res.snippet}</p>
            </a>
          `)}
          ${this.searchResults.length === 0 ? html`<div class="text-xs text-zinc-500 font-mono py-8">No cached pages match your query. Try opening manual pages first to build the offline index.</div>` : ''}
        </div>
      </main>
    `;
  }
}

import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { dbService, PageData, ManualManifest } from '../db/schema';
import { R2Client } from '../services/r2-client';

@customElement('manual-viewer')
export class ManualViewer extends LitElement {
  @property({ type: String }) manualId = '';
  @property({ type: String }) pageId = '';

  @state() private page?: PageData;
  @state() private manifest?: ManualManifest;
  @state() private isFav = false;
  @state() private loading = true;

  createRenderRoot() { return this; }

  async updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('manualId') || changedProperties.has('pageId')) {
      await this.loadData();
    }
  }

  private async loadData() {
    this.loading = true;
    this.manifest = await R2Client.fetchManifest(this.manualId);
    if (this.pageId) {
      this.page = await R2Client.fetchPage(this.manualId, this.pageId);
      if (this.page) {
        this.isFav = await dbService.isFavorite(this.page.id);
      }
    }
    this.loading = false;
  }

  private async toggleFav() {
    if (!this.page) return;
    const added = await dbService.toggleFavorite({
      id: this.page.id,
      manualId: this.manualId,
      pageId: this.pageId,
      title: this.page.title,
      timestamp: Date.now()
    });
    this.isFav = added;
  }

  render() {
    if (this.loading) {
      return html`<div class="p-8 text-xs text-amber-400 font-mono">Loading manual procedure...</div>`;
    }

    return html`
      <div class="flex h-[calc(100vh-61px)] overflow-hidden">
        <aside class="w-72 bg-zinc-950 border-r border-zinc-800/80 p-4 overflow-y-auto no-scrollbar shrink-0">
          <div class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</div>
          <manual-toc .toc="${this.manifest?.toc || []}" .manualId="${this.manualId}" .activePageId="${this.pageId}"></manual-toc>
        </aside>

        <main class="flex-1 bg-zinc-900/50 p-6 overflow-y-auto">
          ${this.page ? html`
            <div class="max-w-4xl mx-auto space-y-4">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 class="text-xl font-black text-white">${this.page.title}</h2>
                  <span class="text-xs text-amber-400 font-mono">${this.manualId} / ${this.pageId}</span>
                </div>
                <button @click="${this.toggleFav}" class="px-3 py-1.5 rounded-xl border text-xs font-bold transition ${this.isFav ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}">
                  ${this.isFav ? '★ Favorited' : '☆ Favorite'}
                </button>
              </div>

              <article class="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
                <div .innerHTML="${this.page.content}"></div>
              </article>
            </div>
          ` : html`
            <div class="text-center py-20 text-zinc-500 text-xs">Select a section from the Table of Contents to view instructions.</div>
          `}
        </main>
      </div>
    `;
  }
}

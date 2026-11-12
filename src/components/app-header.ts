import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('app-header')
export class AppHeader extends LitElement {
  @property({ type: String }) searchQuery = '';

  createRenderRoot() { return this; }

  private handleSearch(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      window.location.hash = `#/search?q=${encodeURIComponent(target.value)}`;
    }
  }

  render() {
    return html`
      <header class="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <a href="#/" class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-zinc-950 shadow-lg shadow-amber-500/20 border border-amber-400/30">
            ⚙️
          </a>
          <div>
            <h1 class="text-sm font-black text-white tracking-wider uppercase">LifeOS Manual Explorer</h1>
            <span class="text-[10px] text-amber-400 font-mono">Offline Ready • Cloudflare R2 Engine</span>
          </div>
        </div>

        <div class="flex-1 max-w-xl">
          <input
            type="search"
            .value="${this.searchQuery}"
            @keyup="${this.handleSearch}"
            placeholder="Search procedures, DTCs, or specs (e.g. P0300, timing chain)..."
            class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold transition"
          />
        </div>
      </header>
    `;
  }
}

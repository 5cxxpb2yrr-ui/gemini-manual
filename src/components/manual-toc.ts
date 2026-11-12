import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TOCNode } from '../db/schema';

@customElement('manual-toc')
export class ManualTOC extends LitElement {
  @property({ type: Array }) toc: TOCNode[] = [];
  @property({ type: String }) manualId = '';
  @property({ type: String }) activePageId = '';

  createRenderRoot() { return this; }

  render() {
    return html`
      <nav class="space-y-1 font-mono text-xs">
        ${this.toc.map(node => this.renderNode(node))}
      </nav>
    `;
  }

  private renderNode(node: TOCNode) {
    const isActive = this.activePageId === node.id;
    return html`
      <div class="space-y-1">
        <a
          href="#/manual/${this.manualId}/page/${node.id}"
          class="block px-3 py-2 rounded-lg transition flex items-center justify-between ${isActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}"
        >
          <span>${node.title}</span>
          <span class="text-[9px] text-zinc-600">${node.id}</span>
        </a>
        ${node.children && node.children.length > 0 ? html`
          <div class="pl-3 border-l border-zinc-800/80 ml-2 space-y-1">
            ${node.children.map(child => this.renderNode(child))}
          </div>
        ` : ''}
      </div>
    `;
  }
}

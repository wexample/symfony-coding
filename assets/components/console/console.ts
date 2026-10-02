import Component from '@wexample/symfony-loader/js/Class/Component';
import { clipboardCopy } from '@wexample/symfony-design-system/js/Helper/ClipboardHelper';

// The copy button of a server-drawn console, when it has one: what it shows,
// as it reads, and for a moment the button says it is done.
export default class extends Component {
  private copyEl?: HTMLButtonElement | null;

  protected async activateListeners(): Promise<void> {
    await super.activateListeners();

    this.copyEl = this.el.querySelector('.console--copy');
    this.copyEl?.addEventListener('click', this.onCopy);
  }

  protected async deactivateListeners(): Promise<void> {
    this.copyEl?.removeEventListener('click', this.onCopy);

    await super.deactivateListeners();
  }

  private onCopy = async (): Promise<void> => {
    const body = this.el.querySelector<HTMLElement>('.console--body');

    if (!this.copyEl || !(await clipboardCopy(body?.innerText ?? ''))) {
      return;
    }

    const label = this.copyEl.dataset.tooltip ?? '';
    this.copyEl.classList.add('is-copied');
    this.copyEl.dataset.tooltip = this.copyEl.dataset.copiedLabel ?? label;

    window.setTimeout(() => {
      this.copyEl?.classList.remove('is-copied');

      if (this.copyEl) {
        this.copyEl.dataset.tooltip = label;
      }
    }, 2000);
  };
}

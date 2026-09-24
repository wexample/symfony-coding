import Field from '@wexample/symfony-design-system/js/Class/Field';
import { type CodeEditor, createCodeEditor } from '../../js/Helper/CodeEditorHelper';

// The server field: an editor laid over the textarea it came with. The textarea
// stays the field — posted with the form, spoken to by the form stack — and is
// only set aside from sight, so the browser can still point at it when it is
// required and left empty.
export default class extends Field {
  private editor?: CodeEditor;
  private sourceEl: HTMLTextAreaElement | null = null;

  protected async activateListeners(): Promise<void> {
    await super.activateListeners();

    const source = this.el.querySelector<HTMLTextAreaElement>('textarea.code-input--source');
    const host = this.el.querySelector<HTMLElement>('.code-input--editor');

    if (!source || !host) {
      return;
    }

    this.sourceEl = source;
    this.editor = await createCodeEditor(host, {
      value: source.value,
      language: this.options?.language ?? null,
      readOnly: Boolean(this.options?.read_only) || source.disabled,
      placeholder: source.placeholder || null,
      label: this.el.querySelector('.form--label')?.textContent?.trim() || null,
      onChange: (value) => {
        if (source.value !== value) {
          source.value = value;
          this.notifyChanged(source);
        }
      },
    });

    host.hidden = false;
    source.classList.add('code-input--source-aside');
    source.addEventListener('input', this.onSourceInput);
  }

  protected async deactivateListeners(): Promise<void> {
    this.sourceEl?.removeEventListener('input', this.onSourceInput);
    this.sourceEl?.classList.remove('code-input--source-aside');
    this.editor?.destroy();
    this.editor = undefined;

    await super.deactivateListeners();
  }

  // Something wrote into the textarea itself — the form stack filling it, an
  // assisted value: the editor shows what the field now holds.
  private onSourceInput = (): void => {
    this.editor?.setValue(this.sourceEl?.value ?? '');
  };
}

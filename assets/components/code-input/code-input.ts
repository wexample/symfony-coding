import Field from '@wexample/symfony-design-system/js/Class/Field';
import { type CodeEditor, createCodeEditor } from '../../js/Helper/CodeEditorHelper';

// The server field: an editor laid over the textarea it came with. The textarea
// stays the field — posted with the form, spoken to by the form stack — and is
// only set aside from sight, so the browser can still point at it when it is
// required and left empty.
export default class extends Field {
  private editor?: CodeEditor;
  private sourceEl: HTMLTextAreaElement | null = null;
  // The field naming the language, when another field of the form chooses it:
  // its group, which hears it change whatever draws it — a native control's
  // `change`, a select component's `select:change` —, and the control it posts.
  private languageGroupEl: HTMLElement | null = null;
  private languageValueEl: HTMLInputElement | HTMLSelectElement | null = null;

  protected async activateListeners(): Promise<void> {
    await super.activateListeners();

    const source = this.el.querySelector<HTMLTextAreaElement>('textarea.code-input--source');
    const host = this.el.querySelector<HTMLElement>('.code-input--editor');

    if (!source || !host) {
      return;
    }

    this.sourceEl = source;
    this.languageGroupEl = this.options?.language_source
      ? document.getElementById(this.options.language_source)?.closest<HTMLElement>('.form--group') ?? null
      : null;
    this.languageValueEl = this.languageGroupEl?.querySelector<HTMLInputElement | HTMLSelectElement>('[name]') ?? null;
    this.editor = await createCodeEditor(host, {
      value: source.value,
      language: this.readLanguage(),
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
    this.languageGroupEl?.addEventListener('change', this.onLanguageChange);
    this.languageGroupEl?.addEventListener('select:change', this.onLanguageChange);
  }

  protected async deactivateListeners(): Promise<void> {
    this.sourceEl?.removeEventListener('input', this.onSourceInput);
    this.languageGroupEl?.removeEventListener('change', this.onLanguageChange);
    this.languageGroupEl?.removeEventListener('select:change', this.onLanguageChange);
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

  // The language the field names, through the map where the two do not share
  // a name; the one given to the field otherwise.
  private readLanguage(): string | null {
    const value = this.languageValueEl?.value;

    if (!value) {
      return this.options?.language ?? null;
    }

    return this.options?.language_map?.[value] ?? value;
  }

  private onLanguageChange = (): void => {
    this.editor?.setLanguage(this.readLanguage());
  };
}

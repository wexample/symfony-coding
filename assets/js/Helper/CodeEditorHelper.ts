import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderText,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Each language is loaded the first time a field asks for it, so a page holding
// one json field does not carry the grammar of every other. A name nobody knows
// is written as plain text, which is what it is to the editor.
const LANGUAGES: Record<string, () => Promise<Extension>> = {
  css: async () => (await import('@codemirror/lang-css')).css(),
  scss: async () => (await import('@codemirror/lang-css')).css(),
  html: async () => (await import('@codemirror/lang-html')).html(),
  javascript: async () => (await import('@codemirror/lang-javascript')).javascript(),
  js: async () => (await import('@codemirror/lang-javascript')).javascript(),
  typescript: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true }),
  ts: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true }),
  jinja: async () => (await import('@codemirror/lang-jinja')).jinja(),
  twig: async () => (await import('@codemirror/lang-jinja')).jinja(),
  json: async () => (await import('@codemirror/lang-json')).json(),
  markdown: async () => (await import('@codemirror/lang-markdown')).markdown(),
  md: async () => (await import('@codemirror/lang-markdown')).markdown(),
  php: async () => (await import('@codemirror/lang-php')).php(),
  python: async () => (await import('@codemirror/lang-python')).python(),
  py: async () => (await import('@codemirror/lang-python')).python(),
  yaml: async () => (await import('@codemirror/lang-yaml')).yaml(),
  yml: async () => (await import('@codemirror/lang-yaml')).yaml(),
};

// The colours are the design system's: each tag reads a token of the colour
// scheme, so a field follows the light and the dark face without being told,
// and code written here wears what code read elsewhere wears.
const CODE_HIGHLIGHT = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.modifier, tags.operatorKeyword], color: 'var(--code-keyword)' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.link], color: 'var(--code-string)' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: 'var(--code-number)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: [tags.propertyName, tags.attributeName], color: 'var(--code-property)' },
  { tag: [tags.tagName, tags.typeName, tags.className], color: 'var(--code-tag)' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--code-function)' },
  { tag: [tags.punctuation, tags.meta, tags.processingInstruction], color: 'var(--code-punctuation)' },
  { tag: tags.heading, color: 'var(--code-keyword)', fontWeight: 'bold' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
]);

/**
 * The editor's own dress, from the tokens as well.
 *
 * The selection is the one thing written with care: CodeMirror draws it on a
 * layer under the lines, and the line the cursor stands on paints a ground of
 * its own over that layer. An opaque ground there hides the selection exactly
 * where it is being made — the field then cannot be edited by sight. The
 * current line is therefore a tint, which lets the selection through, and the
 * selection is given with the selectors CodeMirror's own theme uses, which a
 * lighter selector would lose to.
 */
function buildTheme(dark: boolean): Extension {
  return EditorView.theme(
    {
      '&': {
        color: 'var(--text-color-default)',
        backgroundColor: 'transparent',
        fontSize: 'var(--font-size-2)',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        fontFamily: 'var(--font-family-mono)',
        lineHeight: '1.6',
      },
      '.cm-content': {
        caretColor: 'var(--text-color-default)',
        padding: 'var(--space-2) 0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--text-color-default)',
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'var(--code-selection)',
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--tint-2)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--surface-head)',
        color: 'var(--text-color-head)',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--tint-2)',
        color: 'var(--text-color-muted)',
      },
      '&.cm-focused .cm-matchingBracket, .cm-matchingBracket': {
        backgroundColor: 'var(--tint-4)',
        outline: '1px solid var(--border-color-default)',
      },
      '.cm-placeholder': {
        color: 'var(--text-color-subtle)',
      },
    },
    { dark }
  );
}

export type CodeEditorOptions = {
  value?: string;
  // A name from the list above; anything else is plain text.
  language?: string | null;
  readOnly?: boolean;
  placeholder?: string | null;
  // What the field is called, said by the editable area itself: the label on
  // the page points at a textarea the editor has taken the place of.
  label?: string | null;
  // Long lines fold at the edge rather than scroll it: code in a field is read
  // at the width of the field.
  wrap?: boolean;
  // What a caller adds of its own — an autocompletion, a linter — without the
  // field having to know it.
  extensions?: Extension[];
  onChange?: (value: string) => void;
};

export type CodeEditor = {
  view: EditorView;
  getValue(): string;
  setValue(value: string): void;
  setLanguage(language: string | null): Promise<void>;
  destroy(): void;
};

export async function codeEditorLanguage(language?: string | null): Promise<Extension> {
  const load = language ? LANGUAGES[language.toLowerCase()] : undefined;

  return load ? load() : [];
}

/**
 * An editor for one piece of code, mounted in `parent`: the same one for the
 * server field, which keeps a textarea in step with it, and for the vue one,
 * which keeps a model.
 */
export async function createCodeEditor(
  parent: HTMLElement,
  options: CodeEditorOptions = {}
): Promise<CodeEditor> {
  const language = new Compartment();
  const readOnly = Boolean(options.readOnly);
  // Read from the page's face: the flag only settles what CodeMirror falls
  // back to where the tokens say nothing.
  const dark = parent.closest('.usage-color-scheme-dark') !== null;

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: options.value ?? '',
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        // Tab indents, as it does in any editor; Escape then Tab leaves the
        // field, as CodeMirror provides for whoever moves by keyboard.
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(CODE_HIGHLIGHT),
        buildTheme(dark),
        options.wrap === false ? [] : EditorView.lineWrapping,
        options.placeholder ? placeholderText(options.placeholder) : [],
        options.label ? EditorView.contentAttributes.of({ 'aria-label': options.label }) : [],
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        language.of(await codeEditorLanguage(options.language)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            options.onChange?.(update.state.doc.toString());
          }
        }),
        ...(options.extensions ?? []),
      ],
    }),
  });

  return {
    view,

    getValue: () => view.state.doc.toString(),

    // Only when it differs: a value handed back by whoever listens to the
    // editor is the one it already holds, and rewriting it would move the
    // cursor for nothing.
    setValue(value: string): void {
      if (value === view.state.doc.toString()) {
        return;
      }

      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    },

    async setLanguage(name: string | null): Promise<void> {
      view.dispatch({
        effects: language.reconfigure(await codeEditorLanguage(name)),
      });
    },

    destroy: () => view.destroy(),
  };
}

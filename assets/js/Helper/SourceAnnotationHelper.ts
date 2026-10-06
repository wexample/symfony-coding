import type { Extension, Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { type Diagnostic, lintGutter, setDiagnostics } from '@codemirror/lint';

export type SourceAnnotationSeverity = 'error' | 'warning' | 'info' | 'hint';

// What is said of a place in a text: where — 1-based, the end exclusive, as
// filestate's verdicts give it —, how serious, why, and under which rule.
// Without an end, it runs to the end of its line.
export type SourceAnnotation = {
  line: number;
  column?: number;
  end_line?: number;
  end_column?: number;
  severity?: SourceAnnotationSeverity;
  message: string;
  code?: string | null;
};

type Range = { from: number; to: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * The span of the document an annotation covers, held inside the document
 * whatever it says: a text changed since the verdict was given still shows
 * every annotation somewhere, never throws.
 */
export function sourceAnnotationRange(doc: Text, annotation: SourceAnnotation): Range {
  const start = doc.line(clamp(annotation.line || 1, 1, doc.lines));
  const from = Math.min(start.from + Math.max(0, (annotation.column || 1) - 1), start.to);
  const end = doc.line(clamp(annotation.end_line || annotation.line || 1, 1, doc.lines));
  let to = annotation.end_column
    ? Math.min(end.from + Math.max(0, annotation.end_column - 1), end.to)
    : end.to;

  // A range of nothing is a place all the same: one character, or the line's end.
  if (to <= from) {
    to = Math.min(from + 1, doc.length);
  }

  return { from, to };
}

export function sourceAnnotationsDiagnostics(doc: Text, annotations: SourceAnnotation[]): Diagnostic[] {
  return annotations.map((annotation) => ({
    ...sourceAnnotationRange(doc, annotation),
    severity: annotation.severity || 'warning',
    message: annotation.message,
    source: annotation.code || undefined,
  }));
}

/**
 * What a verdict list becomes here: one annotation per place each verdict
 * names, in the severity the process gives its findings. A verdict about the
 * whole file — no place — is on its first line.
 */
export function sourceAnnotationsFromVerdicts(
  verdicts: Array<{ code?: string; message?: string; locations?: Array<Record<string, number>> }>,
  severity: SourceAnnotationSeverity = 'warning'
): SourceAnnotation[] {
  return verdicts.flatMap((verdict) => {
    const locations = verdict.locations?.length ? verdict.locations : [{ line: 1 }];

    return locations.map((location) => ({
      line: location.line,
      column: location.column,
      end_line: location.end_line,
      end_column: location.end_column,
      severity,
      message: verdict.message ?? '',
      code: verdict.code ?? null,
    }));
  });
}

// The marks and the underlines in the design system's tones: a tint over the
// span rather than CodeMirror's squiggle, which reads as a spelling mistake.
const ANNOTATIONS_THEME = EditorView.theme({
  '.cm-lintRange': {
    backgroundImage: 'none',
    borderRadius: '2px',
  },
  '.cm-lintRange-error': { backgroundColor: 'color-mix(in srgb, var(--error-9) 24%, transparent)' },
  '.cm-lintRange-warning': { backgroundColor: 'color-mix(in srgb, var(--warning-9) 24%, transparent)' },
  '.cm-lintRange-info': { backgroundColor: 'color-mix(in srgb, var(--info-9) 22%, transparent)' },
  '.cm-lintRange-hint': { backgroundColor: 'var(--tint-3)' },
  '.cm-tooltip.cm-tooltip-lint': {
    backgroundColor: 'var(--surface-3)',
    color: 'var(--text-color-default)',
    border: 'var(--border-discreet)',
    borderRadius: 'var(--radius-box)',
    boxShadow: 'var(--shadow-float)',
  },
  '.cm-diagnostic': {
    padding: 'var(--space-1) var(--space-2)',
  },
  '.cm-diagnosticSource': {
    color: 'var(--text-color-muted)',
    fontFamily: 'var(--font-family-mono)',
    fontSize: 'var(--font-size-1)',
  },
});

// What a read source needs to show annotations: the marks in the gutter, and
// their dress. The annotations themselves are set with sourceAnnotationsSet().
export function sourceAnnotationsExtension(): Extension {
  return [lintGutter(), ANNOTATIONS_THEME];
}

export function sourceAnnotationsSet(view: EditorView, annotations: SourceAnnotation[]): void {
  view.dispatch(setDiagnostics(view.state, sourceAnnotationsDiagnostics(view.state.doc, annotations)));
}

// The index of the first annotation covering a position, or -1.
export function sourceAnnotationAt(view: EditorView, pos: number, annotations: SourceAnnotation[]): number {
  return annotations.findIndex((annotation) => {
    const { from, to } = sourceAnnotationRange(view.state.doc, annotation);

    return pos >= from && pos < to;
  });
}

// Brings an annotation to the reader: its span selected, scrolled to the
// middle of the view — smoothly where the editor scrolls itself, the reader
// seeing where it goes; at once where it does not, CodeMirror then moving
// what holds it.
export function sourceAnnotationReveal(view: EditorView, annotation: SourceAnnotation): void {
  const { from, to } = sourceAnnotationRange(view.state.doc, annotation);
  const scroller = view.scrollDOM;
  const scrolls = scroller.scrollHeight > scroller.clientHeight;

  view.dispatch({
    selection: { anchor: from, head: to },
    effects: scrolls ? [] : EditorView.scrollIntoView(from, { y: 'center' }),
  });

  if (scrolls) {
    const block = view.lineBlockAt(from);

    scroller.scrollTo({
      top: view.documentPadding.top + block.top + block.height / 2 - scroller.clientHeight / 2,
      behavior: 'smooth',
    });
  }
}

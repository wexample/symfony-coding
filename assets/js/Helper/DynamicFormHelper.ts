import CodeInput from '../../components/code-input/code-input.vue';

// What symfony-coding hands the design system's dynamic-form for the fields
// only it draws: the design system cannot depend on what depends on it, so a
// form holding code is given this by whoever draws it —
//
//   <dynamic-form :form="form" :field-components="{ code: dynamicFormCodeField }">
//
// — and its `code` fields are written in the editor, coloured in their
// language, as a form drawn by twig writes them (CodeInputType).

type CodeField = {
  language?: string | null;
  languageField?: string | null;
  languageMap?: Record<string, string>;
};

/**
 * The language a code field is written in: its own, or — another field of
 * the form naming it (`languageField`) — that field's value, read through
 * `languageMap` where the two do not share a name.
 */
export function dynamicFormCodeLanguage(field: CodeField, draft: Record<string, unknown> = {}): string | null {
  if (!field.languageField) {
    return field.language ?? null;
  }

  const chosen = String(draft[field.languageField] ?? '');

  return field.languageMap?.[chosen] ?? (chosen || field.language || null);
}

export const dynamicFormCodeField = {
  component: CodeInput,
  props: (field: CodeField, draft: Record<string, unknown>) => ({
    language: dynamicFormCodeLanguage(field, draft)
  })
};

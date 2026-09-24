<script>
import FormField from '@wexample/symfony-design-system/components/_abstract/form-field/form-field.vue';
import { createCodeEditor } from '../../js/Helper/CodeEditorHelper';

// The twin of code-input.html.twig: the same editor, holding a model instead of
// a textarea. The editor itself is kept off the reactive state — vue watching
// it would watch every keystroke of an object that already tells when it
// changes.
export default {
  extends: FormField,

  template: '#vue-template-wexample-symfony-coding-bundle-components-code-input-code-input',

  emits: ['update:modelValue'],

  props: {
    modelValue: {
      type: String,
      default: ''
    },
    // A grammar name: json, yaml, python, markdown, html, css, js, ts, php,
    // twig. Anything else is plain text.
    language: {
      type: String,
      default: null
    },
    placeholder: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    wrap: {
      type: Boolean,
      default: true
    },
    // What a caller adds of its own — an autocompletion, a linter.
    extensions: {
      type: Array,
      default: () => []
    }
  },

  async mounted() {
    this.editor = await createCodeEditor(this.$refs.editor, {
      value: this.modelValue ?? '',
      language: this.language,
      readOnly: this.readOnly || this.disabled,
      placeholder: this.placeholder || null,
      label: this.label ? this.resolveLabel(this.label) : null,
      wrap: this.wrap,
      extensions: this.extensions,
      onChange: (value) => this.$emit('update:modelValue', value)
    });
  },

  beforeUnmount() {
    this.editor?.destroy();
    this.editor = null;
  },

  watch: {
    modelValue(value) {
      this.editor?.setValue(value ?? '');
    },

    language(value) {
      this.editor?.setLanguage(value);
    }
  }
};
</script>

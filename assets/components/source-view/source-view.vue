<script>
import { EditorView } from '@codemirror/view';
import { createCodeEditor } from '../../js/Helper/CodeEditorHelper';
import {
  sourceAnnotationAt,
  sourceAnnotationReveal,
  sourceAnnotationsExtension,
  sourceAnnotationsSet
} from '../../js/Helper/SourceAnnotationHelper';

// A text read as its source, what was said of it marked on it: each span
// tinted in its severity, a mark in the gutter on its line, the message and
// the rule under the pointer. The editor of code-input, read only — the same
// one will be the place to correct it. Says which annotation is pointed at
// (`annotation-hover`, its index or null) and which is clicked
// (`annotation-click`); `reveal(index)` brings one to the reader.
export default {
  template: '#vue-template-wexample-symfony-coding-bundle-components-source-view-source-view',

  emits: ['annotation-click', 'annotation-hover'],

  props: {
    text: {
      type: String,
      default: ''
    },
    // A grammar name or a file extension: md, yaml, php…
    language: {
      type: String,
      default: null
    },
    // Each one: { line, column, end_line, end_column, severity, message, code },
    // 1-based, the end exclusive.
    annotations: {
      type: Array,
      default: () => []
    },
    wrap: {
      type: Boolean,
      default: true
    }
  },

  async mounted() {
    let hovered = null;

    this.editor = await createCodeEditor(this.$refs.editor, {
      value: this.text,
      language: this.language,
      readOnly: true,
      wrap: this.wrap,
      extensions: [
        sourceAnnotationsExtension(),
        EditorView.domEventHandlers({
          click: (event, view) => {
            const index = this.annotationAtEvent(event, view);

            if (index >= 0) {
              this.$emit('annotation-click', index);
            }
          },
          mousemove: (event, view) => {
            const index = this.annotationAtEvent(event, view);
            const next = index >= 0 ? index : null;

            if (next !== hovered) {
              hovered = next;
              this.$emit('annotation-hover', next);
            }
          }
        })
      ]
    });

    sourceAnnotationsSet(this.editor.view, this.annotations);
  },

  beforeUnmount() {
    this.editor?.destroy();
    this.editor = null;
  },

  watch: {
    text(value) {
      this.editor?.setValue(value ?? '');
      this.editor && sourceAnnotationsSet(this.editor.view, this.annotations);
    },

    language(value) {
      this.editor?.setLanguage(value);
    },

    annotations: {
      deep: true,
      handler(value) {
        this.editor && sourceAnnotationsSet(this.editor.view, value);
      }
    }
  },

  methods: {
    annotationAtEvent(event, view) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });

      return pos === null ? -1 : sourceAnnotationAt(view, pos, this.annotations);
    },

    reveal(index) {
      const annotation = this.annotations[index];

      if (this.editor && annotation) {
        sourceAnnotationReveal(this.editor.view, annotation);
      }
    }
  }
};
</script>

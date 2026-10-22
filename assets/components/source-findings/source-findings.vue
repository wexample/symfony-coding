<script>
import SourceView from '../source-view/source-view.vue';
import Marker from '@wexample/symfony-design-system/components/marker/marker.vue';

const TONES = { error: 'error', warning: 'warning', info: 'info', hint: 'neutral' };

// The source on one side, the findings on the other, kept in step: a finding
// clicked brings its span to the reader, a span pointed at lights its finding.
// Says which finding is chosen (`select`, its index) for a page that does more
// with it — a fix, a detail.
export default {
  template: '#vue-template-wexample-symfony-coding-bundle-components-source-findings-source-findings',

  components: {
    SourceView,
    // `marker` is an svg element, which vue refuses as a component id.
    Capsule: Marker
  },

  emits: ['select'],

  props: {
    text: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: null
    },
    // Each one: { line, column, end_line, end_column, severity, message, code }.
    annotations: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      active: null,
      selected: null
    };
  },

  methods: {
    select(index) {
      this.selected = index;
      this.$refs.source?.reveal(index);
      this.$refs.items?.[index]?.scrollIntoView({ block: 'nearest' });
      this.$emit('select', index);
    },

    tone(severity) {
      return TONES[severity] || 'warning';
    },

    lineLabel(annotation) {
      return annotation.column ? `${annotation.line}:${annotation.column}` : String(annotation.line);
    }
  }
};
</script>

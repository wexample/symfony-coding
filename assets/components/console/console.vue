<script>
import { ansiSegments } from '../../js/Helper/AnsiHelper';

// The twin of console.html.twig, and the one that takes lines as they come:
// given a `topic`, it listens to it through the live updates service and adds
// what each message carries — a string, a line { kind, text }, or { lines }.
// A parent can add lines itself, through `append`. Only the last `maxLines`
// are kept, and the view follows the end unless the reader has scrolled up.
export default {
  template: '#vue-template-wexample-symfony-coding-bundle-components-console-console',

  props: {
    lines: {
      type: Array,
      default: () => []
    },
    prompt: {
      type: String,
      default: '$'
    },
    title: {
      type: String,
      default: null
    },
    // The live updates topic lines arrive on.
    topic: {
      type: String,
      default: null
    },
    maxLines: {
      type: Number,
      default: 1000
    },
    // A CSS length; the console scrolls inside it.
    maxHeight: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      received: []
    };
  },

  computed: {
    shownLines() {
      return [...this.lines, ...this.received]
        .slice(-this.maxLines)
        .map((line) => this.normalize(line));
    },

    resolvedLabel() {
      return this.title || this.trans('WexampleSymfonyCodingBundle.common.coding::console.label');
    }
  },

  watch: {
    shownLines() {
      this.followEnd();
    }
  },

  mounted() {
    if (this.topic) {
      this.app.services.liveUpdates?.connect({
        topics: this.topic,
        owner: this,
        onMessage: (connection, payload) => this.append(payload)
      });
    }
  },

  beforeUnmount() {
    this.app.services.liveUpdates?.disconnectOwner(this);
  },

  methods: {
    append(payload) {
      const lines = Array.isArray(payload?.lines) ? payload.lines : [payload];

      this.received.push(...lines.filter((line) => line !== null && line !== undefined));

      if (this.received.length > this.maxLines) {
        this.received.splice(0, this.received.length - this.maxLines);
      }
    },

    normalize(line) {
      const entry = typeof line === 'string' ? { text: line } : line;

      return {
        kind: entry.kind || 'output',
        prompt: entry.prompt || this.prompt,
        segments: ansiSegments(String(entry.text ?? ''))
      };
    },

    // Kept at the end only if it was there: a reader who scrolled up to read
    // something is not pulled away from it by the next line.
    followEnd() {
      const body = this.$refs.body;

      if (!body) {
        return;
      }

      const atEnd = body.scrollHeight - body.scrollTop - body.clientHeight < 24;

      if (atEnd) {
        this.$nextTick(() => {
          body.scrollTop = body.scrollHeight;
        });
      }
    }
  }
};
</script>

<script>
import { ansiSegments } from '../../js/Helper/AnsiHelper';
import { clipboardCopy } from '@wexample/symfony-design-system/js/Helper/ClipboardHelper';

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
    // A whole text as a program wrote it — an error message —, each of its
    // lines output, before the lines given.
    text: {
      type: String,
      default: null
    },
    // A button in the bar copying what the console shows.
    copy: {
      type: Boolean,
      default: false
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
      copied: false,
      received: []
    };
  },

  computed: {
    shownLines() {
      const text = this.text === null ? [] : this.text.split('\n');

      return [...text, ...this.lines, ...this.received]
        .slice(-this.maxLines)
        .map((line) => this.normalize(line));
    },

    copyLabel() {
      return this.trans('WexampleSymfonyCodingBundle.common.coding::console.copy');
    },

    copiedLabel() {
      return this.trans('WexampleSymfonyCodingBundle.common.coding::console.copied');
    },

    copyIconHtml() {
      return this.app.getServiceOrFail('icon').icon('ph:bold/copy');
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
    // What is shown, as it reads: the prompts with their commands, the
    // terminal's colours left behind.
    async copyShown() {
      if (!(await clipboardCopy(this.$refs.body?.innerText ?? ''))) {
        return;
      }

      this.copied = true;
      window.setTimeout(() => {
        this.copied = false;
      }, 2000);
    },

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

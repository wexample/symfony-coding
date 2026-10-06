<script>
import SourceView from '../source-view/source-view.vue';

const KEY_SAVE = ['s', 'S'];
const DOMAIN = 'WexampleSymfonyCodingBundle.common.coding::editor.';

// A text edited where it is read, and written back on its own: a while after
// the last keystroke (`delay`), or at once on Ctrl+S / Cmd+S. What is sent is
// the whole text, as `content`, with `token` as `_token`, to `saveUrl`; a 2xx
// is a save. The line at its foot says where the text stands — modified,
// saving, saved, not saved. Leaving with something unsaved sends it on the way
// out.
export default {
  template: '#vue-template-wexample-symfony-coding-bundle-components-source-editor-source-editor',

  components: {
    SourceView
  },

  emits: ['saved'],

  props: {
    text: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: null
    },
    // What is said of the text, marked on it as the view marks it
    // (source-view): { line, column, end_line, end_column, severity, message,
    // code }, 1-based, the end exclusive.
    annotations: {
      type: Array,
      default: () => []
    },
    // What leads to a range of the text from elsewhere on the page (source-view).
    revealName: {
      type: String,
      default: null
    },
    saveUrl: {
      type: String,
      required: true
    },
    token: {
      type: String,
      default: null
    },
    // Milliseconds of quiet after a change before it is written.
    delay: {
      type: Number,
      default: 2000
    },
    flush: {
      type: Boolean,
      default: false
    },
    // A selector the state is said in rather than at the editor's foot: the
    // layout's footer (`#footer-status`).
    statusTarget: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      // idle: nothing done yet · dirty: changed, not sent · saving · saved ·
      // failed: the last attempt did not go through.
      state: 'idle'
    };
  },

  computed: {
    stateLabel() {
      return this.state === 'idle' ? '' : this.trans(DOMAIN + this.state);
    }
  },

  created() {
    this.value = this.text;
    this.savedValue = this.text;
    this.timer = null;
    this.inFlight = null;
  },

  mounted() {
    const keyboard = this.app.services.keyboard;

    KEY_SAVE.forEach((key) => keyboard.registerKeyDown(this, key, () => this.save(), {
      preventDefault: true,
      priority: 10,
      enabled: (event) => (event.ctrlKey || event.metaKey) && !event.altKey && this.$el.isConnected
    }));
  },

  beforeUnmount() {
    this.app.services.keyboard.unregisterOwner(this);
    clearTimeout(this.timer);

    if (this.value !== this.savedValue) {
      this.send(this.value, true);
    }
  },

  watch: {
    // Another text handed in — the same editor showing another file — is the
    // new reference: nothing of it is unsaved yet.
    text(value) {
      clearTimeout(this.timer);
      this.value = value;
      this.savedValue = value;
      this.state = 'idle';
    }
  },

  methods: {
    changed(value) {
      this.value = value;
      clearTimeout(this.timer);

      if (value === this.savedValue) {
        this.state = this.state === 'idle' ? 'idle' : 'saved';

        return;
      }

      this.state = 'dirty';
      this.timer = setTimeout(() => this.save(), this.delay);
    },

    async save() {
      clearTimeout(this.timer);

      // One write at a time: the next starts from where this one ends.
      if (this.inFlight) {
        await this.inFlight;
      }

      const value = this.value;

      if (value === this.savedValue) {
        if (this.state !== 'idle') {
          this.state = 'saved';
        }

        return;
      }

      this.state = 'saving';
      this.inFlight = this.send(value);
      const ok = await this.inFlight;
      this.inFlight = null;

      if (!ok) {
        this.state = 'failed';

        return;
      }

      this.savedValue = value;
      this.$emit('saved', value);

      // Typed on while it was on its way: still to be written.
      if (this.value !== value) {
        this.changed(this.value);
      } else {
        this.state = 'saved';
      }
    },

    async send(value, keepalive = false) {
      const body = new FormData();
      body.append('content', value);

      if (this.token) {
        body.append('_token', this.token);
      }

      try {
        const response = await fetch(this.saveUrl, {
          method: 'POST',
          body,
          keepalive,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        return response.ok;
      } catch (e) {
        return false;
      }
    }
  }
};
</script>

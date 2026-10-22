export type AnsiSegment = {
  text: string;
  classes: string[];
};

// The eight colours a terminal names, and their bright twins, read as the
// categorical palette's: what the console draws them with is the design
// system's own, in either scheme.
const COLORS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

// SGR sequences only — colour, weight — the rest of what a terminal is told
// (the cursor, the screen) has no meaning in a page and is dropped.
const SEQUENCE = /\x1b\[([0-9;]*)([A-Za-z])/g;

/**
 * Text written for a terminal, cut into runs of one style each. The classes
 * are the console's: `console--fg-red`, `console--bold`, `console--dim`.
 * The twin of AnsiHelper.php, which draws the same runs server-side.
 */
export function ansiSegments(input: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  let color: string | null = null;
  let bold = false;
  let dim = false;
  let cursor = 0;

  const push = (text: string): void => {
    if (text === '') {
      return;
    }

    const classes = [
      color ? `console--fg-${color}` : null,
      bold ? 'console--bold' : null,
      dim ? 'console--dim' : null,
    ].filter((name): name is string => name !== null);

    segments.push({ text, classes });
  };

  for (const match of input.matchAll(SEQUENCE)) {
    push(input.slice(cursor, match.index));
    cursor = (match.index ?? 0) + match[0].length;

    if (match[2] !== 'm') {
      continue;
    }

    const codes = match[1] === '' ? [0] : match[1].split(';').map(Number);

    codes.forEach((code) => {
      if (code === 0) {
        color = null;
        bold = false;
        dim = false;
      } else if (code === 1) {
        bold = true;
      } else if (code === 2) {
        dim = true;
      } else if (code === 22) {
        bold = false;
        dim = false;
      } else if (code === 39) {
        color = null;
      } else if (code >= 30 && code <= 37) {
        color = COLORS[code - 30];
      } else if (code >= 90 && code <= 97) {
        color = COLORS[code - 90];
      }
    });
  }

  push(input.slice(cursor));

  return segments;
}

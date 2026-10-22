<?php

namespace Wexample\SymfonyCoding\Helper;

/**
 * Text written for a terminal, drawn as markup: its colours and weight become
 * the console's classes, everything else a terminal is told is dropped. The
 * twin of AnsiHelper.ts, which draws the same runs in the browser.
 */
class AnsiHelper
{
    private const array COLORS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

    public static function toHtml(string $input): string
    {
        $html = '';
        $color = null;
        $bold = false;
        $dim = false;
        $cursor = 0;

        $push = static function (string $text) use (&$html, &$color, &$bold, &$dim): void {
            if ('' === $text) {
                return;
            }

            $classes = array_filter([
                $color ? 'console--fg-'.$color : null,
                $bold ? 'console--bold' : null,
                $dim ? 'console--dim' : null,
            ]);
            $escaped = htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            $html .= $classes
                ? '<span class="'.implode(' ', $classes).'">'.$escaped.'</span>'
                : $escaped;
        };

        preg_match_all('/\x1b\[([0-9;]*)([A-Za-z])/', $input, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

        foreach ($matches as $match) {
            [$sequence, $offset] = $match[0];
            $push(substr($input, $cursor, $offset - $cursor));
            $cursor = $offset + strlen($sequence);

            if ('m' !== $match[2][0]) {
                continue;
            }

            $codes = '' === $match[1][0] ? [0] : array_map('intval', explode(';', $match[1][0]));

            foreach ($codes as $code) {
                if (0 === $code) {
                    $color = null;
                    $bold = false;
                    $dim = false;
                } elseif (1 === $code) {
                    $bold = true;
                } elseif (2 === $code) {
                    $dim = true;
                } elseif (22 === $code) {
                    $bold = false;
                    $dim = false;
                } elseif (39 === $code) {
                    $color = null;
                } elseif ($code >= 30 && $code <= 37) {
                    $color = self::COLORS[$code - 30];
                } elseif ($code >= 90 && $code <= 97) {
                    $color = self::COLORS[$code - 90];
                }
            }
        }

        $push(substr($input, $cursor));

        return $html;
    }
}

<?php

namespace Wexample\SymfonyCoding\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Wexample\SymfonyCoding\Helper\AnsiHelper;

class AnsiExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            // Escapes the text itself: what comes out is safe to print raw.
            new TwigFilter('ansi_html', [AnsiHelper::class, 'toHtml'], ['is_safe' => ['html']]),
        ];
    }
}

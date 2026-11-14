<?php

declare(strict_types=1);

namespace Wexample\SymfonyCoding\Tests\Unit\Helper;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Wexample\SymfonyCoding\Helper\AnsiHelper;

class AnsiHelperTest extends TestCase
{
    /**
     * @return iterable<string, array{string, string}>
     */
    public static function runs(): iterable
    {
        yield 'plain text, escaped' => ['<a & "b">', '&lt;a &amp; &quot;b&quot;&gt;'];
        yield 'a colour, then reset' => ["\e[31mred\e[0m plain", '<span class="console--fg-red">red</span> plain'];
        yield 'an empty sequence resets' => ["\e[2mdim\e[m plain", '<span class="console--dim">dim</span> plain'];
        yield 'bright colours read as the plain ones' => ["\e[91mred", '<span class="console--fg-red">red</span>'];
        yield 'weight off, colour kept' => [
            "\e[1;32mok\e[22m still",
            '<span class="console--fg-green console--bold">ok</span><span class="console--fg-green"> still</span>',
        ];
        yield 'colour off, weight kept' => [
            "\e[1;34mx\e[39my",
            '<span class="console--fg-blue console--bold">x</span><span class="console--bold">y</span>',
        ];
        yield 'what is no style is dropped' => ["a\e[2Kb\e[1Gc", 'abc'];
        yield 'an unknown code changes nothing' => ["\e[4mx", 'x'];
    }

    #[DataProvider('runs')]
    public function testToHtml(
        string $input,
        string $expected
    ): void {
        $this->assertSame($expected, AnsiHelper::toHtml($input));
    }
}

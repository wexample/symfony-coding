<?php

namespace Wexample\SymfonyCoding\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\Forms;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Wexample\SymfonyCoding\Form\Type\HtmlInputType;

class HtmlInputTypeTest extends TestCase
{
    public function testWhatCouldRunIsRemovedAndTheRestKept(): void
    {
        $form = Forms::createFormFactoryBuilder()->getFormFactory()->create(HtmlInputType::class);

        $form->submit('<p>Hello <strong>you</strong></p><script>alert(1)</script><a href="javascript:alert(2)" onclick="steal()">link</a><img src="x" onerror="steal()">');

        $html = $form->getData();
        $this->assertStringContainsString('<p>Hello <strong>you</strong></p>', $html);
        $this->assertStringNotContainsString('script', $html);
        $this->assertStringNotContainsString('javascript:', $html);
        $this->assertStringNotContainsString('onclick', $html);
        $this->assertStringNotContainsString('onerror', $html);
        $this->assertStringContainsString('link', $html);
    }

    public function testAnApplicationSanitizerDecidesWhatStays(): void
    {
        $strict = new HtmlSanitizer((new HtmlSanitizerConfig())->allowElement('p')->blockElement('em'));
        $form = Forms::createFormFactoryBuilder()
            ->addType(new HtmlInputType($strict))
            ->getFormFactory()
            ->create(HtmlInputType::class);

        $form->submit('<p>Kept <em>flattened</em></p>');

        $this->assertSame('<p>Kept flattened</p>', $form->getData());
    }

    public function testNothingStaysNothing(): void
    {
        $form = Forms::createFormFactoryBuilder()->getFormFactory()->create(HtmlInputType::class);
        $form->submit('');

        $this->assertNull($form->getData());
    }
}

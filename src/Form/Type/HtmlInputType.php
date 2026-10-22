<?php

namespace Wexample\SymfonyCoding\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerInterface;
use Wexample\SymfonyForms\Form\Type\TextareaInputType;

/**
 * HTML written as code, in a textarea, and cleaned before it is kept: what is
 * stored can be shown again without running anything — no script, no `on…`
 * attribute, no `javascript:` link. Safe elements are kept by default; an
 * application tightens or widens that with its own sanitizer.
 */
class HtmlInputType extends AbstractType
{
    public function __construct(
        private readonly ?HtmlSanitizerInterface $sanitizer = null,
    ) {
    }

    public function getParent(): string
    {
        return TextareaInputType::class;
    }

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $sanitizer = $this->sanitizer ?? new HtmlSanitizer((new HtmlSanitizerConfig())->allowSafeElements());

        $builder->addEventListener(FormEvents::PRE_SUBMIT, static function (FormEvent $event) use ($sanitizer): void {
            $html = $event->getData();

            if (is_string($html) && '' !== $html) {
                $event->setData($sanitizer->sanitize($html));
            }
        });
    }
}

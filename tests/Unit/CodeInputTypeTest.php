<?php

namespace Wexample\SymfonyCoding\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\Extension\Core\Type\FormType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Forms;
use Wexample\SymfonyCoding\Form\Type\CodeInputType;

class CodeInputTypeTest extends TestCase
{
    public function testTheLanguageFieldIsNamedByItsId(): void
    {
        $view = Forms::createFormFactoryBuilder()->getFormFactory()
            ->createNamedBuilder('message', FormType::class)
            ->add('format', TextType::class)
            ->add('content', CodeInputType::class, [
                'language_field' => 'format',
                'language_map' => ['text' => 'jinja'],
            ])
            ->getForm()
            ->createView();

        $this->assertSame('message_format', $view['content']->vars['language_source']);
        $this->assertSame(['text' => 'jinja'], $view['content']->vars['language_map']);
    }

    public function testAFieldOfItsOwnLanguageNamesNoOther(): void
    {
        $view = Forms::createFormFactoryBuilder()->getFormFactory()
            ->create(CodeInputType::class, null, ['language' => 'json'])
            ->createView();

        $this->assertSame('json', $view->vars['language']);
        $this->assertNull($view->vars['language_source']);
    }
}

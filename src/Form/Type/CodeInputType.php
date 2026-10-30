<?php

namespace Wexample\SymfonyCoding\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Wexample\SymfonyForms\Form\Type\TextareaInputType;

/**
 * Code written in a form: a textarea, posted as one, with an editor laid over
 * it that colours `language`. A field whose language is chosen by another field
 * of the form — a format select — names it in `language_field`; its value is the
 * language, read through `language_map` where the two do not share a name.
 */
class CodeInputType extends AbstractType
{
    public function getParent(): string
    {
        return TextareaInputType::class;
    }

    public function getBlockPrefix(): string
    {
        return 'code_input';
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'language' => null,
            'language_field' => null,
            'language_map' => [],
        ]);
        $resolver->setAllowedTypes('language', ['null', 'string']);
        $resolver->setAllowedTypes('language_field', ['null', 'string']);
        $resolver->setAllowedTypes('language_map', ['array']);
    }

    public function buildView(
        FormView $view,
        FormInterface $form,
        array $options
    ): void {
        $view->vars['language'] = $options['language'];
        $view->vars['language_map'] = $options['language_map'];
        // The other field by the id Symfony gives it: its parent's, then its name.
        $view->vars['language_source'] = $options['language_field'] && $view->parent
            ? $view->parent->vars['id'].'_'.$options['language_field']
            : null;
    }
}

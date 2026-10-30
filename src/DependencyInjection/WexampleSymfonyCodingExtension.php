<?php

namespace Wexample\SymfonyCoding\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Wexample\SymfonyHelpers\DependencyInjection\AbstractWexampleSymfonyExtension;

class WexampleSymfonyCodingExtension extends AbstractWexampleSymfonyExtension
{
    public const string FORM_THEME = '@WexampleSymfonyCodingBundle/form/form_theme.html.twig';

    public function prepend(ContainerBuilder $container): void
    {
        parent::prepend($container);

        if (! $container->hasExtension('twig')) {
            return;
        }

        $container->prependExtensionConfig('twig', [
            'form_themes' => [self::FORM_THEME],
        ]);
    }

    public function load(
        array $configs,
        ContainerBuilder $container
    ): void {
        $this->loadConfig(
            __DIR__,
            $container
        );
    }
}

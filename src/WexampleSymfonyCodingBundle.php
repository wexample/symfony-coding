<?php

namespace Wexample\SymfonyCoding;

use Wexample\SymfonyDesignSystem\Interface\DesignSystemElementsBundleInterface;
use Wexample\SymfonyHelpers\Class\AbstractBundle;
use Wexample\SymfonyHelpers\Helper\BundleHelper;
use Wexample\SymfonyHelpers\Interface\LoaderBundleInterface;

class WexampleSymfonyCodingBundle extends AbstractBundle implements LoaderBundleInterface, DesignSystemElementsBundleInterface
{
    public static function getLoaderFrontPaths(): array
    {
        return [
            BundleHelper::getBundleCssAlias(static::class) => __DIR__ . '/../assets/',
        ];
    }

    public static function getDesignSystemElementsPath(): string
    {
        return __DIR__ . '/../assets/';
    }
}

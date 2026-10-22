<?php

namespace Wexample\SymfonyCoding\Traits;

use Wexample\SymfonyCoding\WexampleSymfonyCodingBundle;
use Wexample\SymfonyHelpers\Traits\BundleClassTrait;

trait SymfonyCodingBundleClassTrait
{
    use BundleClassTrait;

    public static function getBundleClassName(): string
    {
        return WexampleSymfonyCodingBundle::class;
    }
}

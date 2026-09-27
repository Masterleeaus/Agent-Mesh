<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Company;

final class CompanyExecutionContextFactory
{
    public static function fromApplication(mixed $app, CompanyContextResolverContract $resolver): CompanyExecutionContext
    {
        $context = new CompanyExecutionContext();
        if (!is_object($app) || !method_exists($app, 'bound') || !$app->bound('request')) {
            return $context;
        }

        $request = $app->make('request');
        if (!is_object($request) || !method_exists($request, 'user') || $request->user() === null) {
            return $context;
        }

        $context->restore($resolver->companyIdFromRequest($request));
        return $context;
    }
}

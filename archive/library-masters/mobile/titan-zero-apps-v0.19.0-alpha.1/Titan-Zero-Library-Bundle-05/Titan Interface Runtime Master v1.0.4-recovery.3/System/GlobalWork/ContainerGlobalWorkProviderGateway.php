<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\GlobalWork;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Registry\GlobalWorkDescriptor;
use Illuminate\Contracts\Container\Container;

final readonly class ContainerGlobalWorkProviderGateway implements GlobalWorkProviderGatewayContract
{
    public function __construct(private Container $container)
    {
    }

    public function fetch(GlobalWorkDescriptor $descriptor, InterfaceContext $context, int $limit): GlobalWorkProviderResult
    {
        if ($limit < 1 || $limit > 500) throw new \InvalidArgumentException('Global work provider limit must be between 1 and 500.');
        $binding = $descriptor->binding();
        if (! $this->container->bound($binding)) throw new GlobalWorkProviderUnavailable("Global work provider {$descriptor->providerKey()} is not bound.");

        try {
            $provider = $this->container->make($binding);
        } catch (\Throwable $e) {
            throw new GlobalWorkProviderUnavailable("Global work provider {$descriptor->providerKey()} could not be resolved.", 0, $e);
        }
        if (! $provider instanceof GlobalWorkProviderContract) {
            throw new GlobalWorkProviderUnavailable("Global work provider {$descriptor->providerKey()} does not implement the required contract.");
        }

        $result = $provider->fetch($context, $descriptor->tray, $limit);
        if ($result->health->providerKey !== $descriptor->providerKey()) {
            throw new GlobalWorkProviderUnavailable("Global work provider {$descriptor->providerKey()} returned mismatched health identity.");
        }
        return $result;
    }
}

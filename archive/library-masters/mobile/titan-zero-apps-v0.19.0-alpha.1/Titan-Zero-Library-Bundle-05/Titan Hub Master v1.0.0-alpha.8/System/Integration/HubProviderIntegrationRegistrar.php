<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Integration;

use App\Extensions\TitanHub\System\Contracts\HubContributionRegistry;
use App\Extensions\TitanHub\System\Integration\BookingsQuotes\BookingsQuotesHubContributor;
use Illuminate\Contracts\Foundation\Application;

final class HubProviderIntegrationRegistrar
{
    public function __construct(private Application $app,private HubContributionRegistry $registry){}
    public function register(): void
    {
        $read='App\\Extensions\\TitanBookingsQuotes\\System\\Contracts\\BookingReadPort';
        $commands='App\\Extensions\\TitanBookingsQuotes\\System\\Contracts\\BookingCommandPort';
        if(interface_exists($read)&&interface_exists($commands)&&$this->app->bound($read)&&$this->app->bound($commands)){
            $this->registry->register(new BookingsQuotesHubContributor($this->app->make($read),$this->app->make($commands)));
        }
    }
}

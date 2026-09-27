<?php

namespace Modules\CustomerFeedback\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Entities\FeedbackReply;
use Modules\CustomerFeedback\Observers\FeedbackTicketObserver;
use Modules\CustomerFeedback\Observers\FeedbackReplyObserver;

class CustomerFeedbackServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../Config/config.php', 'customer-feedback');
        $this->mergeConfigFrom(__DIR__ . '/../Config/resolution.php', 'customer-feedback-resolution');
        $this->mergeConfigFrom(__DIR__ . '/../Config/titanzero.php', 'customer-feedback-titanzero');
        if (file_exists(__DIR__ . '/../Config/ai.php')) {
            $this->mergeConfigFrom(__DIR__ . '/../Config/ai.php', 'customer-feedback-ai');
        }
    }

    public function boot()
    {
        FeedbackTicket::observe(FeedbackTicketObserver::class);
        FeedbackReply::observe(FeedbackReplyObserver::class);

        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__ . '/../Routes/web.php');
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');

        $viewsPath = __DIR__ . '/../Resources/views';
        if (is_dir($viewsPath)) {
            $this->loadViewsFrom($viewsPath, 'customer-feedback');
            $this->publishes([$viewsPath => resource_path('views/modules/customer-feedback')], 'customer-feedback-views');
        }

        $langPath = __DIR__ . '/../Resources/lang';
        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, 'customer-feedback');
            $this->publishes([$langPath => resource_path('lang/modules/customer-feedback')], 'customer-feedback-lang');
        }

        if (class_exists(\Modules\TitanZeroAssurance\Services\CapabilityRegistry::class)) {
            app(\Modules\TitanZeroAssurance\Services\CapabilityRegistry::class)
                ->registerModuleFromArray('CustomerFeedback', (array) config('customer-feedback-titanzero.capabilities', []));
        }

        $this->publishes([__DIR__ . '/../Config' => config_path('customer-feedback')], 'customer-feedback-config');
    }
}

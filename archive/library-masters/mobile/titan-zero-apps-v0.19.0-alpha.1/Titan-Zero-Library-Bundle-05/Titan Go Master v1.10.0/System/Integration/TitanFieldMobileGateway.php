<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Integration;

use App\Extensions\TitanGo\System\Contracts\TitanFieldMobileGatewayInterface;

final class TitanFieldMobileGateway implements TitanFieldMobileGatewayInterface
{
    private const ROUTES = [
        'context' => 'titan-field.mobile.context',
        'register_device' => 'titan-field.mobile.devices.register',
        'replay' => 'titan-field.mobile.replay',
        'sync' => 'titan-field.mobile.sync',
        'evidence' => 'titan-field.mobile.evidence',
    ];

    private const OPERATIONS = [
        'work_order.note',
        'work_order.task_status',
        'work_order.status',
        'work_order.complete',
        'work_order.time',
        'dispatch.status',
        'route_stop.status',
        'form.response',
        'form.submit',
        'evidence.reference',
        'signature.reference',
        'location.batch',
    ];

    public function contextRoute(): string { return self::ROUTES['context']; }
    public function registerDeviceRoute(): string { return self::ROUTES['register_device']; }
    public function replayRoute(): string { return self::ROUTES['replay']; }
    public function syncRoute(): string { return self::ROUTES['sync']; }
    public function evidenceRoute(): string { return self::ROUTES['evidence']; }
    public function replayOperations(): array { return self::OPERATIONS; }
    public function maxBatchSize(): int { return 100; }
}

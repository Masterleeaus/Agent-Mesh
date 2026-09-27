<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Context;

use App\Extensions\InteractionEngine\System\Contracts\ContextProviderInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class ContextBuilder
{
    private array $providers = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function registerProvider(ContextProviderInterface $provider): void
    {
        $this->providers[] = $provider;
    }

    public function build(array $state): array
    {
        $companyId = $this->tenantContext->companyId();
        $stateTenant = trim((string) ($state['company_id'] ?? ''));
        if ($stateTenant === '' || $stateTenant !== $companyId) {
            throw new \RuntimeException('Interaction state does not belong to the active company tenant.');
        }

        $context = [
            'company_id' => $companyId,
            'user' => $this->getUser((int) $state['user_id']),
            'answers' => $this->getAnswers($state),
            'interaction' => [
                'id' => $state['interaction_id'],
                'definition_version' => $state['definition_version'] ?? '1.0.0',
            ],
            'device' => $this->getDeviceInfo(),
            'timestamp' => gmdate(DATE_ATOM),
        ];
        foreach ($this->providers as $provider) {
            $context = array_replace_recursive($context, $provider->provide($state));
        }
        return $context;
    }

    private function getUser(int $userId): array
    {
        if (function_exists('auth')) {
            $user = auth()->user();
            if ($user && (int) $user->getAuthIdentifier() === $userId) {
                return method_exists($user, 'toArray') ? $user->toArray() : ['id' => $userId];
            }
        }

        // Never load a host user by naked ID. The authenticated actor is the
        // only trusted user object at this boundary.
        return ['id' => $userId];
    }

    private function getAnswers(array $state): array
    {
        $answers = [];
        foreach ($state['answers'] ?? [] as $answer) {
            if (is_object($answer) && isset($answer->questionKey)) {
                $answers[$answer->questionKey] = $answer->value;
            } elseif (is_array($answer) && isset($answer['question_key'])) {
                $answers[$answer['question_key']] = $answer['value'] ?? null;
            }
        }
        return $answers;
    }

    private function getDeviceInfo(): array
    {
        if (!function_exists('request') || !app()->bound('request')) {
            return ['platform' => 'unknown', 'ip' => 'unknown'];
        }
        return [
            'platform' => request()->userAgent() ?? 'unknown',
            'ip' => request()->ip() ?? 'unknown',
        ];
    }
}

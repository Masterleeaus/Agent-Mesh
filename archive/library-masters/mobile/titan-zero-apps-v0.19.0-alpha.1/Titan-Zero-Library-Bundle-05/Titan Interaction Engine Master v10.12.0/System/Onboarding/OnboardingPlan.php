<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding;

final readonly class OnboardingPlan
{
    /** @param list<OnboardingAction> $actions */
    public function __construct(
        public string $id,
        public string $companyId,
        public array $actions,
        public string $generatedAt,
        public string $profile = 'field_home_services',
    ) {
        if ($id === '' || trim($companyId) === '') {
            throw new \InvalidArgumentException('Onboarding plan id and company_id are required.');
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->companyId,
            'profile' => $this->profile,
            'generated_at' => $this->generatedAt,
            'actions' => array_map(static fn(OnboardingAction $a): array => $a->toArray(), $this->actions),
            'summary' => [
                'total' => count($this->actions),
                'approval_required' => count(array_filter($this->actions, static fn(OnboardingAction $a): bool => $a->requiresApproval)),
            ],
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            (string) ($data['id'] ?? ''),
            (string) ($data['company_id'] ?? ''),
            array_values(array_map(static fn(array $a): OnboardingAction => OnboardingAction::fromArray($a), (array) ($data['actions'] ?? []))),
            (string) ($data['generated_at'] ?? gmdate(DATE_ATOM)),
            (string) ($data['profile'] ?? 'field_home_services'),
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Surfaces;

final class SurfaceWizardPolicy
{
    private const ALLOW = [
        'zero' => ['new_customer_v1','create_quote_v1','create_job_v1','complete_job_v1','create_invoice_v1','service_booking_v1','job_variation_approval_v1','materials_request_v1','site_variation_v1','practical_completion_defects_v1','incident_response_v1','inspection_corrective_action_v1','field_home_services_onboarding_v1'],
        'go' => ['complete_job_v1','materials_request_v1','job_variation_approval_v1','site_variation_v1','practical_completion_defects_v1','incident_response_v1','inspection_corrective_action_v1'],
        'hub' => ['new_customer_v1','service_booking_v1'],
    ];

    public function allows(string $surface, string $wizardId, ?string $journey = null): bool
    {
        $surface = $this->canonicalSurface($surface);
        if ($journey !== null && $this->canonicalJourney($journey) === 'onboarding' && $surface !== 'zero') {
            return false;
        }
        return in_array($wizardId, self::ALLOW[$surface] ?? [], true);
    }

    /** @return list<string> */
    public function wizardIds(string $surface): array
    {
        return self::ALLOW[$this->canonicalSurface($surface)] ?? [];
    }

    public function canonicalSurface(string $surface): string
    {
        return match (strtolower(trim($surface))) {
            'bos','command','owner','manager','business','titan_bos','titan-bos','titan_command','titan-command' => 'zero',
            'field','worker','titan_go','titan-go' => 'go',
            'customer','titan_hub','titan-hub' => 'hub',
            // Onboarding is a Zero journey, never a fourth canonical surface.
            'onboarding','setup','titan_onboarding','titan-onboarding' => 'zero',
            default => strtolower(trim($surface)),
        };
    }

    public function canonicalJourney(?string $journey): ?string
    {
        if ($journey === null || trim($journey) === '') return null;
        return match (strtolower(trim($journey))) {
            'setup','business_initial_onboarding','field_home_services_onboarding','field_home_services_onboarding_v1' => 'onboarding',
            default => strtolower(trim($journey)),
        };
    }

    /** @return list<string> */
    public function canonicalSurfaces(): array
    {
        return ['zero','go','hub'];
    }
}

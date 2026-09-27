<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Profile;

use App\Extensions\InteractionEngine\System\Template\TemplateDefinition;
use App\Extensions\InteractionEngine\System\Wizard\WizardDefinition;

final class FieldHomeServicesProfile
{
    public const ID = 'field_home_services';
    public const VERTICALS = [
        'cleaning',
        'plumbing',
        'electrical',
        'hvac',
        'handyman-property-maintenance',
        'landscaping-gardening',
        'pest-control',
        'locksmith-security',
        'roofing-guttering',
        'appliance-equipment-repair',
    ];

    /** @return list<string> */
    public function businessTypes(): array { return self::VERTICALS; }

    /** @return list<string> */
    public function wizardIds(): array
    {
        return [
            'field_home_services_onboarding_v1','new_customer_v1','create_quote_v1','create_job_v1',
            'complete_job_v1','create_invoice_v1','service_booking_v1','job_variation_approval_v1',
            'materials_request_v1','site_variation_v1','practical_completion_defects_v1',
            'incident_response_v1','inspection_corrective_action_v1',
        ];
    }

    /** @return list<string> */
    public function templateIds(): array
    {
        return [
            'customer-onboarding','quote-builder','job-creation','job-completion','invoice-creation','service-booking',
            'job-variation-approval','materials-request','site-variation','practical-completion-defects','incident-response',
            'inspection-corrective-action','field-job-handover','recurring-service-agreement','staff-onboarding','payment-reconciliation',
        ];
    }

    public function allowsWizard(WizardDefinition $wizard): bool { return in_array($wizard->id,$this->wizardIds(),true); }
    public function allowsTemplate(TemplateDefinition $template): bool { return in_array($template->id,$this->templateIds(),true); }
}

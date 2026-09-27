<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Security;

use App\Extensions\InteractionEngine\System\Wizard\WizardDefinition;

final class WizardAccessPolicy
{
    public function mayAccess(WizardDefinition $wizard, array $actorContext): bool
    {
        $companyId = trim((string) ($actorContext['company_id'] ?? ''));
        $userId = trim((string) ($actorContext['user_id'] ?? ''));
        if ($companyId === '' || $userId === '') return false;
        if (isset($actorContext['company_id']) && (string) $actorContext['company_id'] !== $companyId) return false;

        $required = array_values(array_map('strval', $wizard->permissions));
        if ($required === []) return true;
        $roles = array_values(array_map('strval', (array) ($actorContext['roles'] ?? [])));
        return array_intersect($roles, $required) !== [];
    }
}

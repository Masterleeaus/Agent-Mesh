<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Contracts;

interface ApplicationProvisioningGateway
{
    /** @return list<array<string,mixed>> */
    public function getApplications(int $companyId): array;
    public function getApplication(int $companyId, string $surface): ?array;
    public function createApplication(int $companyId, string $surface, ?string $actorId = null, array $audit = []): array;
    public function provisionApplicationSet(int $companyId, array $configuration = [], ?string $actorId = null, array $audit = []): array;
    public function handoff(int $companyId): array;
    public function configureIdentity(int $companyId, string $surface, array $identity, ?string $actorId = null, array $audit = []): array;
    public function configureSharedBrand(int $companyId, array $brand, ?string $actorId = null, array $audit = []): array;
    public function configureBrand(int $companyId, string $surface, array $brand, ?string $actorId = null, array $audit = []): array;
    public function configureNavigation(int $companyId, string $surface, array $navigation, ?string $actorId = null, array $audit = []): array;
    public function configureFeatures(int $companyId, string $surface, array $features, ?string $actorId = null, array $audit = []): array;
    public function configurePages(int $companyId, string $surface, array $pageSlugs, ?string $actorId = null, array $audit = []): array;
    public function configureTheme(int $companyId, string $surface, string $theme, ?string $actorId = null, array $audit = []): array;
    public function configureAssistantPresentation(int $companyId, string $surface, array $assistant, ?string $actorId = null, array $audit = []): array;
    public function configurePrivacy(int $companyId, string $surface, array $privacy, ?string $actorId = null, array $audit = []): array;
    public function configureNotifications(int $companyId, string $surface, array $notifications, ?string $actorId = null, array $audit = []): array;
    public function configureOfflinePolicy(int $companyId, string $surface, array $offline, ?string $actorId = null, array $audit = []): array;
    public function applyVerticalPack(int $companyId, string $surface, string $verticalSlug, ?string $actorId = null, array $audit = []): array;
    public function preview(int $companyId, string $surface, array $previewContext = []): array;
    public function validate(int $companyId, string $surface): array;
    public function getReadiness(int $companyId, string $surface): array;
    public function publish(int $companyId, string $surface, ?string $actorId = null, array $audit = []): array;
    public function rollback(int $companyId, string $surface, int $snapshotId, ?string $actorId = null, array $audit = []): array;
    public function activate(int $companyId, string $surface, int $snapshotId, ?string $actorId = null, array $audit = []): array;
}

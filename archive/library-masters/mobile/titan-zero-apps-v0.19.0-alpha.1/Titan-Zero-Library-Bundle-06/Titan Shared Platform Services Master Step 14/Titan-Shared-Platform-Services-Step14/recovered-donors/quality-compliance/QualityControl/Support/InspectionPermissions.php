<?php

namespace Modules\QualityControl\Support;

final class InspectionPermissions
{
    public const VIEW   = 'view_quality_control';
    public const CREATE = 'add_quality_control';
    public const UPDATE = 'edit_quality_control';
    public const DELETE = 'delete_quality_control';
    public const VIEW_REPORTS = 'view_qc_reports';
    public const MANAGE_TEMPLATES = 'manage_qc_templates';
    public const TRIGGER_RECLEAN = 'trigger_reclean';
    public const VIEW_CLEANER_RATINGS = 'view_cleaner_ratings';

    public const LEGACY_VIEW   = 'inspection.view';
    public const LEGACY_CREATE = 'inspection.create';
    public const LEGACY_UPDATE = 'inspection.update';
    public const LEGACY_DELETE = 'inspection.delete';

    public const LEGACY_ADD_INSPECTION = 'add_inspection';
    public const LEGACY_VIEW_INSPECTION = 'view_inspection';
    public const LEGACY_EDIT_INSPECTION = 'edit_inspection';
    public const LEGACY_DELETE_INSPECTION = 'delete_inspection';
    public const LEGACY_VIEW_INSPECTIONS = 'view_inspections';
    public const LEGACY_CREATE_INSPECTION = 'create_inspection';
    public const LEGACY_APPROVE_INSPECTION = 'approve_inspection';
    public const LEGACY_REQUEST_RECLEAN = 'request_reclean';

    public const MAP = [
        self::VIEW => [
            self::LEGACY_VIEW,
            self::LEGACY_VIEW_INSPECTION,
            self::LEGACY_VIEW_INSPECTIONS,
        ],
        self::CREATE => [
            self::LEGACY_CREATE,
            self::LEGACY_ADD_INSPECTION,
            self::LEGACY_CREATE_INSPECTION,
        ],
        self::UPDATE => [
            self::LEGACY_UPDATE,
            self::LEGACY_EDIT_INSPECTION,
            self::LEGACY_APPROVE_INSPECTION,
        ],
        self::DELETE => [
            self::LEGACY_DELETE,
            self::LEGACY_DELETE_INSPECTION,
        ],
        self::MANAGE_TEMPLATES => [
            self::LEGACY_CREATE,
            self::LEGACY_UPDATE,
            self::LEGACY_CREATE_INSPECTION,
            self::LEGACY_EDIT_INSPECTION,
        ],
        self::TRIGGER_RECLEAN => [
            self::LEGACY_REQUEST_RECLEAN,
            self::LEGACY_APPROVE_INSPECTION,
        ],
    ];

    public static function legacyFor(string $permission): ?string
    {
        return self::MAP[$permission][0] ?? null;
    }

    public static function aliasesFor(string $permission): array
    {
        return self::MAP[$permission] ?? [];
    }
}

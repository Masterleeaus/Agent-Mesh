<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

abstract class CompanyScopedModel extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(static function (self $model): void {
            if (trim((string) $model->getAttribute('company_id')) === '') {
                throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'Company-scoped records require an authorised company identifier.');
            }
        });

        static::updating(static function (self $model): void {
            $original = trim((string) $model->getOriginal('company_id'));
            $current = trim((string) $model->getAttribute('company_id'));
            if ($original === '' || $current === '' || ! hash_equals($original, $current)) {
                throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'The company identifier of a Maps record is immutable.');
            }
        });
    }

    public function scopeForCompany(Builder $query, string $companyId): Builder
    {
        if (trim($companyId) === '') {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'A non-empty authorised company identifier is required.');
        }

        return $query->where($query->getModel()->qualifyColumn('company_id'), $companyId);
    }
}
